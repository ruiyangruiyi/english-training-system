export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGroupMessage, getWecomConfig } from '@/lib/wecom';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const results = await sendHomeworkReminders();
    
    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      details: results.details,
    });
  } catch (error) {
    console.error('定时提醒失败:', error);
    return NextResponse.json({ error: '执行失败' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reminders = await getHomeworkReminders();
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('获取提醒失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

async function getHomeworkReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const homeworks = await prisma.homework.findMany({
    where: {
      dueDate: { gte: now, lte: tomorrow },
    },
    include: {
      homeworkClasses: {
        include: {
          class: true,
        },
      },
      completions: true,
    },
  });

  const reminders: Array<{
    chatId: string;
    className: string;
    homework: string;
    dueDate: string;
    urgency: string;
    message: string;
  }> = [];

  for (const hw of homeworks) {
    const hoursLeft = (hw.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const urgency = hoursLeft <= 6 ? '紧急' : hoursLeft <= 24 ? '今日' : '明日';

    for (const hc of hw.homeworkClasses) {
      if (!hc.class.wechatGroupId) continue;

      const message = `${urgency} 作业提醒\n\n${hw.title}\n截止: ${hw.dueDate.toLocaleDateString('zh-CN')}\n\n${hw.content}\n\n完成后请回复"已完成"`;

      reminders.push({
        chatId: hc.class.wechatGroupId,
        className: hc.class.name,
        homework: hw.title,
        dueDate: hw.dueDate.toISOString(),
        urgency,
        message,
      });
    }
  }

  return reminders;
}

async function sendHomeworkReminders() {
  const config = await getWecomConfig();
  if (!config) {
    return { sent: 0, failed: 0, details: [] };
  }

  const reminders = await getHomeworkReminders();
  const results = { sent: 0, failed: 0, details: [] as Array<{ chatId: string; success: boolean; error?: string }> };

  for (const reminder of reminders) {
    try {
      await sendGroupMessage(reminder.chatId, reminder.message);
      results.sent++;
      results.details.push({ chatId: reminder.chatId, success: true });
    } catch (error) {
      results.failed++;
      results.details.push({ chatId: reminder.chatId, success: false, error: String(error) });
    }
  }

  return results;
}
