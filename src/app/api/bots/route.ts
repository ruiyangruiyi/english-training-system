import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bots - 获取机器人列表
export async function GET() {
  try {
    const bots = await prisma.bot.findMany({
      include: {
        _count: { select: { classes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 检查心跳超时（超过5分钟视为离线）
    const now = new Date();
    const botsWithStatus = bots.map(bot => {
      let effectiveStatus = bot.status;
      if (bot.status === 'online' && bot.lastHeartbeat) {
        const diff = now.getTime() - new Date(bot.lastHeartbeat).getTime();
        if (diff > 5 * 60 * 1000) {
          effectiveStatus = 'offline';
        }
      }
      return {
        ...bot,
        effectiveStatus,
        groupCount: bot._count.classes
      };
    });

    return NextResponse.json(botsWithStatus);
  } catch (error) {
    console.error('获取机器人列表失败:', error);
    return NextResponse.json({ error: '获取机器人列表失败' }, { status: 500 });
  }
}

// POST /api/bots - 添加机器人
export async function POST(request: NextRequest) {
  try {
    const { wechatId, name, maxGroups, serverIp } = await request.json();

    if (!wechatId || !name) {
      return NextResponse.json({ error: '微信号和名称不能为空' }, { status: 400 });
    }

    // 检查微信号是否已存在
    const existing = await prisma.bot.findUnique({
      where: { wechatId }
    });

    if (existing) {
      return NextResponse.json({ error: '该微信号已添加' }, { status: 400 });
    }

    const bot = await prisma.bot.create({
      data: {
        wechatId,
        name,
        maxGroups: maxGroups || 50,
        serverIp: serverIp || null,
        status: 'offline'
      }
    });

    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    console.error('添加机器人失败:', error);
    return NextResponse.json({ error: '添加机器人失败' }, { status: 500 });
  }
}
