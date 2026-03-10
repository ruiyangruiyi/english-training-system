import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/wecom/chat-summary - 生成群聊摘要
 * 调用OpenAI API分析当日群消息，生成摘要
 */
export async function POST(request: NextRequest) {
  try {
    const { chatId, date } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: '缺少chatId' }, { status: 400 });
    }

    // 默认今天
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 获取当日消息
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      return NextResponse.json({ error: '当日无消息' }, { status: 404 });
    }

    // 格式化消息
    const formattedMessages = messages.map(m => 
      `[${m.userName || m.userId}]: ${m.content}`
    ).join('\n');

    // 调用AI生成摘要
    const summary = await generateSummary(formattedMessages, messages.length);

    // 保存摘要
    const saved = await prisma.chatSummary.upsert({
      where: { chatId_date: { chatId, date: dayStart } },
      create: {
        chatId,
        date: dayStart,
        summary,
        messageCount: messages.length,
      },
      update: {
        summary,
        messageCount: messages.length,
      },
    });

    return NextResponse.json({
      chatId,
      date: dayStart.toISOString().split('T')[0],
      messageCount: messages.length,
      summary,
    });
  } catch (error) {
    console.error('生成摘要失败:', error);
    return NextResponse.json({ error: '生成摘要失败' }, { status: 500 });
  }
}

/**
 * GET /api/wecom/chat-summary - 获取群聊摘要
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '7');

    if (!chatId) {
      return NextResponse.json({ error: '缺少chatId' }, { status: 400 });
    }

    if (date) {
      // 获取指定日期摘要
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const summary = await prisma.chatSummary.findUnique({
        where: { chatId_date: { chatId, date: targetDate } },
      });

      return NextResponse.json(summary || { error: '未找到摘要' });
    }

    // 获取最近N天摘要
    const summaries = await prisma.chatSummary.findMany({
      where: { chatId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(summaries);
  } catch (error) {
    return NextResponse.json({ error: '获取摘要失败' }, { status: 500 });
  }
}

/**
 * 调用OpenAI生成摘要
 */
async function generateSummary(messages: string, count: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Mock模式
  if (!apiKey) {
    return `[Mock摘要] 今日共${count}条消息。主要讨论了课程安排和作业完成情况。`;
  }

  const prompt = `你是一个英语培训班的助手。请分析以下家长群的聊天记录，生成一份简洁的中文摘要，包括：
1. 主要讨论话题
2. 重要通知或作业
3. 家长关心的问题
4. 需要老师跟进的事项

聊天记录：
${messages}

请用简洁的中文输出摘要，不超过200字。`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '生成摘要失败';
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    return `[生成失败] 今日共${count}条消息。`;
  }
}
