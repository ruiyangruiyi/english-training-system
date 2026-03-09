import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/wecom/homework-reminder - 触发作业提醒
export async function POST(request: NextRequest) {
  try {
    const { classId, daysAhead = 1 } = await request.json();

    // 计算截止日期范围
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysAhead);
    targetDate.setHours(23, 59, 59);

    // 查询即将截止的作业
    const where: any = {
      dueDate: {
        gte: now,
        lte: targetDate
      }
    };

    if (classId) {
      where.homeworkClasses = {
        some: { classId: parseInt(classId) }
      };
    }

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        homeworkClasses: {
          include: {
            class: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    if (homeworks.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有即将截止的作业',
        reminders: []
      });
    }

    // 生成提醒消息
    const reminders = homeworks.map(hw => {
      const dueDate = new Date(hw.dueDate);
      const hoursLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let urgency = '📚';
      if (hoursLeft <= 24) urgency = '🔴';
      else if (hoursLeft <= 48) urgency = '🟡';

      const classes = hw.homeworkClasses.map(hc => ({
        classId: hc.class.id,
        className: hc.class.name,
        wechatGroupId: hc.class.wechatGroupId
      }));

      const message = `${urgency} 作业提醒\n\n📝 ${hw.title}\n⏰ 截止：${formatDate(dueDate)}（${hoursLeft}小时后）\n\n请同学们按时完成！`;

      return {
        homeworkId: hw.id,
        title: hw.title,
        dueDate: hw.dueDate,
        hoursLeft,
        message,
        targetGroups: classes.filter(c => c.wechatGroupId)
      };
    });

    // 生成发送队列
    const sendQueue = reminders.flatMap(r =>
      r.targetGroups.map(g => ({
        groupId: g.wechatGroupId,
        className: g.className,
        message: r.message
      }))
    );

    return NextResponse.json({
      success: true,
      message: `生成了 ${reminders.length} 条提醒`,
      reminders,
      sendQueue
    });

  } catch (error) {
    console.error('生成作业提醒失败:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}

// GET /api/wecom/homework-reminder - 获取今日待提醒作业
export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59);

    const homeworks = await prisma.homework.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: tomorrow
        }
      },
      include: {
        homeworkClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                wechatGroupId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      count: homeworks.length,
      homeworks: homeworks.map(hw => ({
        id: hw.id,
        title: hw.title,
        dueDate: hw.dueDate,
        classes: hw.homeworkClasses.map(hc => hc.class)
      }))
    });

  } catch (error) {
    console.error('获取待提醒作业失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
