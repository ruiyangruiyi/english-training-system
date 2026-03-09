import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 作业关键词识别
const HOMEWORK_KEYWORDS = ['作业', '练习', '背诵', '完成', '提交', '截止'];

// POST /api/wechat/homework - 接收并解析微信群作业消息
export async function POST(request: Request) {
  try {
    const { groupId, groupName, sender, content, timestamp } = await request.json();

    if (!groupId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 查找绑定该微信群的班级
    const boundClass = await prisma.class.findFirst({
      where: { wechatGroupId: groupId },
    });

    if (!boundClass) {
      return NextResponse.json({
        success: false,
        message: '该群未绑定任何班级',
        parsed: false,
      });
    }

    // 检查消息是否包含作业关键词
    const isHomework = HOMEWORK_KEYWORDS.some(keyword => content.includes(keyword));

    if (!isHomework) {
      return NextResponse.json({
        success: true,
        message: '非作业消息，已忽略',
        parsed: false,
      });
    }

    // 解析作业内容
    const parsedHomework = parseHomeworkContent(content);

    // 创建作业记录
    const homework = await prisma.homework.create({
      data: {
        title: parsedHomework.title,
        content: parsedHomework.content,
        dueDate: parsedHomework.dueDate,
        homeworkClasses: {
          create: {
            classId: boundClass.id,
          },
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
      success: true,
      message: '作业已同步到系统',
      parsed: true,
      homework: {
        id: homework.id,
        title: homework.title,
        content: homework.content,
        dueDate: homework.dueDate,
        class: boundClass.name,
      },
    });
  } catch (error) {
    console.error('处理微信作业消息失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}

// 解析作业内容
function parseHomeworkContent(content: string): {
  title: string;
  content: string;
  dueDate: Date;
} {
  // 尝试提取截止日期
  const datePatterns = [
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /周([一二三四五六日天])/,
    /明天|后天|下周/,
  ];

  let dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3); // 默认3天后截止

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      if (pattern === datePatterns[0]) {
        // X月X日
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        dueDate = new Date(dueDate.getFullYear(), month, day);
      } else if (pattern === datePatterns[1]) {
        // YYYY-MM-DD
        dueDate = new Date(match[0]);
      } else if (content.includes('明天')) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (content.includes('后天')) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);
      }
      break;
    }
  }

  // 提取标题（取前20个字符或第一行）
  const firstLine = content.split('\n')[0];
  const title = firstLine.length > 30 
    ? firstLine.substring(0, 30) + '...' 
    : firstLine;

  return {
    title: title || '新作业',
    content: content,
    dueDate,
  };
}
