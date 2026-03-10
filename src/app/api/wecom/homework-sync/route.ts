import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 作业识别关键词
const HOMEWORK_KEYWORDS = ['作业', 'homework', '今日任务', '练习', '背诵', '完成'];
// 作业格式标记
const HOMEWORK_MARKERS = ['【作业】', '[作业]', '📝'];

// POST /api/wecom/homework-sync - 接收群消息，识别并同步作业
export async function POST(request: NextRequest) {
  try {
    const { chatId, content, sender, msgId, timestamp } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 查找关联的班级
    const classItem = await prisma.class.findFirst({
      where: { wechatGroupId: chatId }
    });

    if (!classItem) {
      return NextResponse.json({
        success: false,
        isHomework: false,
        message: '未找到关联班级'
      });
    }

    // 检查是否是作业消息
    const isHomework = checkIsHomework(content);

    if (!isHomework) {
      return NextResponse.json({
        success: true,
        isHomework: false,
        message: '非作业消息'
      });
    }

    // 解析作业内容
    const parsed = parseHomework(content);

    // 创建作业记录
    const homework = await prisma.homework.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        dueDate: parsed.dueDate,
        homeworkClasses: {
          create: {
            classId: classItem.id
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      isHomework: true,
      message: '作业已同步',
      homework: {
        id: homework.id,
        title: homework.title,
        dueDate: homework.dueDate,
        className: classItem.name
      }
    });

  } catch (error) {
    console.error('作业同步失败:', error);
    return NextResponse.json({ error: '同步失败' }, { status: 500 });
  }
}

// 检查是否是作业消息
function checkIsHomework(content: string): boolean {
  const text = content.toLowerCase();
  
  // 检查格式标记
  for (const marker of HOMEWORK_MARKERS) {
    if (content.includes(marker)) return true;
  }
  
  // 检查关键词
  for (const keyword of HOMEWORK_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) return true;
  }
  
  return false;
}

// 解析作业内容
function parseHomework(content: string): {
  title: string;
  content: string;
  dueDate: Date;
} {
  // 提取标题（第一行或前30字符）
  let title = content.split('\n')[0];
  
  // 移除格式标记
  for (const marker of HOMEWORK_MARKERS) {
    title = title.replace(marker, '').trim();
  }
  
  if (title.length > 30) {
    title = title.substring(0, 30) + '...';
  }

  // 解析截止日期
  const dueDate = parseDueDate(content);

  return {
    title: title || '新作业',
    content: content,
    dueDate
  };
}

// 解析截止日期
function parseDueDate(content: string): Date {
  const now = new Date();
  
  // 匹配"明天"
  if (content.includes('明天')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59);
    return date;
  }
  
  // 匹配"后天"
  if (content.includes('后天')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 2);
    date.setHours(23, 59, 59);
    return date;
  }
  
  // 匹配"X月X日"
  const dateMatch = content.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const date = new Date(now.getFullYear(), month, day, 23, 59, 59);
    if (date < now) date.setFullYear(date.getFullYear() + 1);
    return date;
  }
  
  // 匹配"周X"
  const weekMatch = content.match(/周([一二三四五六日天])/);
  if (weekMatch) {
    const weekMap: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
    };
    const targetDay = weekMap[weekMatch[1]];
    const date = new Date(now);
    const currentDay = date.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    date.setDate(date.getDate() + daysToAdd);
    date.setHours(23, 59, 59);
    return date;
  }
  
  // 默认3天后
  const defaultDate = new Date(now);
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setHours(23, 59, 59);
  return defaultDate;
}
