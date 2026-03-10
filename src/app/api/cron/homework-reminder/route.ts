import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGroupMessage, getWecomConfig } from '@/lib/wecom';

/**
 * POST /api/cron/homework-reminder - 定时作业提醒
 * 由Vercel Cron或外部调度器触发
 * 
 * Vercel cron配置 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/homework-reminder",
 *     "schedule": "0 18 * * *"  // 每天18:00
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证cron密钥（防止未授权调用）
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

/**
 * GET /api/cron/homework-reminder - 预览待发送提醒
 */
export async function GET(request: NextRequest) {
  try {
    const reminders = await getHomeworkReminders();
    return NextResponse.json(reminders);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 获取待发送的作业提醒
 */
async function getHomeworkReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  // 查询即将到期的作业（今天和明天）
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
    const urgency = hoursLeft <= 6 ? '🔴紧急' : hoursLeft <= 24 ? '🟡今日' : '📚明日';

    for (const hc of hw.homeworkClasses) {
      if (!hc.class.wechatGroupId) continue;

      const message = `${urgency} 作业提醒\n\n📝 ${hw.title}\n📅 截止：${hw.dueDate.toLocaleDateString('zh-CN')}\n\n${hw.content}\n\n完成后请回复"已完成"`;

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

/**
 * 发送作业提醒
 */
async function sendHomeworkReminders() {
  const config = getWecomConfig();
  const reminders = await getHomeworkReminders();
  
  let sent = 0;
  let failed = 0;
  const details: Array<{ chatId: string; status: string; error?: string }> = [];

  for (const reminder of reminders) {
    try {
      if (config.corpId) {
        // 真实模式：发送企业微信消息
        await sendGroupMessage({
          chatid: reminder.chatId,
          msgtype: 'text',
          text: { content: reminder.message },
        });
      } else {
        // Mock模式
        console.log(`[Mock] 发送提醒到 ${reminder.className}: ${reminder.homework}`);
      }
      
      sent++;
      details.push({ chatId: reminder.chatId, status: 'sent' });
    } catch (error) {
      failed++;
      details.push({
        chatId: reminder.chatId,
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  return { sent, failed, details };
}
