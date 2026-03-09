import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/wechat/reminder - 触发作业提醒
export async function POST(request: Request) {
  try {
    const { classId, homeworkId, type } = await request.json();

    // 获取需要提醒的作业
    let homeworks;
    
    if (homeworkId) {
      // 指定作业提醒
      homeworks = await prisma.homework.findMany({
        where: { id: homeworkId },
        include: {
          homeworkClasses: {
            include: {
              class: true,
            },
          },
        },
      });
    } else if (classId) {
      // 指定班级的所有未完成作业
      homeworks = await prisma.homework.findMany({
        where: {
          dueDate: { gte: new Date() },
          homeworkClasses: {
            some: { classId },
          },
        },
        include: {
          homeworkClasses: {
            include: {
              class: true,
            },
          },
        },
      });
    } else {
      // 所有即将截止的作业（3天内）
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      homeworks = await prisma.homework.findMany({
        where: {
          dueDate: {
            gte: new Date(),
            lte: threeDaysLater,
          },
        },
        include: {
          homeworkClasses: {
            include: {
              class: true,
            },
          },
        },
      });
    }

    if (homeworks.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要提醒的作业',
        reminders: [],
      });
    }

    // 生成提醒消息
    const reminders = homeworks.map(homework => {
      const classes = homework.homeworkClasses.map(hc => ({
        classId: hc.class.id,
        className: hc.class.name,
        wechatGroupId: hc.class.wechatGroupId,
        wechatGroupName: hc.class.wechatGroupName,
      }));

      const daysLeft = Math.ceil(
        (new Date(homework.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const message = generateReminderMessage(homework, daysLeft, type);

      return {
        homeworkId: homework.id,
        title: homework.title,
        dueDate: homework.dueDate,
        daysLeft,
        message,
        targetGroups: classes.filter(c => c.wechatGroupId),
      };
    });

    // 过滤出有绑定微信群的提醒
    const validReminders = reminders.filter(r => r.targetGroups.length > 0);

    return NextResponse.json({
      success: true,
      message: `生成了 ${validReminders.length} 条提醒`,
      reminders: validReminders,
      // 供机器人使用的发送队列
      sendQueue: validReminders.flatMap(r =>
        r.targetGroups.map(g => ({
          groupId: g.wechatGroupId,
          groupName: g.wechatGroupName,
          message: r.message,
        }))
      ),
    });
  } catch (error) {
    console.error('生成作业提醒失败:', error);
    return NextResponse.json({ error: '生成提醒失败' }, { status: 500 });
  }
}

// 生成提醒消息
function generateReminderMessage(
  homework: { title: string; content: string; dueDate: Date },
  daysLeft: number,
  type?: string
): string {
  const dueStr = new Date(homework.dueDate).toLocaleDateString('zh-CN');
  
  let urgency = '';
  if (daysLeft <= 0) {
    urgency = '⚠️ 【已截止】';
  } else if (daysLeft === 1) {
    urgency = '🔴 【明天截止】';
  } else if (daysLeft <= 3) {
    urgency = '🟡 【即将截止】';
  } else {
    urgency = '📚';
  }

  if (type === 'gentle') {
    return `${urgency} 作业提醒\n\n📝 ${homework.title}\n⏰ 截止日期：${dueStr}\n\n请同学们合理安排时间完成作业哦～`;
  }

  if (type === 'urgent') {
    return `${urgency} 紧急提醒！\n\n📝 作业：${homework.title}\n⏰ 截止：${dueStr}（还剩${daysLeft}天）\n\n请尚未完成的同学抓紧时间！`;
  }

  // 默认提醒
  return `${urgency} 作业提醒\n\n📝 作业：${homework.title}\n📋 内容：${homework.content.substring(0, 100)}${homework.content.length > 100 ? '...' : ''}\n⏰ 截止日期：${dueStr}\n\n请同学们按时完成！`;
}

// GET /api/wechat/reminder - 获取待发送的提醒列表
export async function GET() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const urgentHomeworks = await prisma.homework.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: tomorrow,
        },
      },
      include: {
        homeworkClasses: {
          include: {
            class: true,
          },
        },
      },
    });

    return NextResponse.json({
      count: urgentHomeworks.length,
      homeworks: urgentHomeworks.map(h => ({
        id: h.id,
        title: h.title,
        dueDate: h.dueDate,
        classes: h.homeworkClasses.map(hc => ({
          id: hc.class.id,
          name: hc.class.name,
          wechatGroupId: hc.class.wechatGroupId,
        })),
      })),
    });
  } catch (error) {
    console.error('获取提醒列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
