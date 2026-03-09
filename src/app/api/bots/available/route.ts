import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bots/available - 获取可用机器人（负载最低的在线机器人）
export async function GET() {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 获取所有在线且未满的机器人
    const bots = await prisma.bot.findMany({
      where: {
        status: 'online',
        lastHeartbeat: { gte: fiveMinutesAgo }
      },
      include: {
        _count: { select: { classes: true } }
      }
    });

    // 过滤出未满的机器人
    const availableBots = bots
      .filter(bot => bot._count.classes < bot.maxGroups)
      .map(bot => ({
        id: bot.id,
        wechatId: bot.wechatId,
        name: bot.name,
        groupCount: bot._count.classes,
        maxGroups: bot.maxGroups,
        availableSlots: bot.maxGroups - bot._count.classes,
        serverIp: bot.serverIp,
        lastHeartbeat: bot.lastHeartbeat
      }))
      .sort((a, b) => a.groupCount - b.groupCount); // 按负载从低到高排序

    if (availableBots.length === 0) {
      return NextResponse.json({
        available: false,
        message: '没有可用的机器人，请添加新机器人或等待现有机器人上线',
        bots: []
      });
    }

    return NextResponse.json({
      available: true,
      recommended: availableBots[0], // 推荐负载最低的
      bots: availableBots
    });
  } catch (error) {
    console.error('获取可用机器人失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST /api/bots/available - 自动分配群到最佳机器人
export async function POST(request: Request) {
  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: '班级ID不能为空' }, { status: 400 });
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 获取负载最低的在线机器人
    const bots = await prisma.bot.findMany({
      where: {
        status: 'online',
        lastHeartbeat: { gte: fiveMinutesAgo }
      },
      include: {
        _count: { select: { classes: true } }
      }
    });

    const availableBots = bots
      .filter(bot => bot._count.classes < bot.maxGroups)
      .sort((a, b) => a._count.classes - b._count.classes);

    if (availableBots.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有可用的机器人'
      }, { status: 400 });
    }

    const selectedBot = availableBots[0];

    // 分配班级到该机器人
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { botId: selectedBot.id },
      include: {
        bot: { select: { id: true, name: true, wechatId: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: `已自动分配到机器人: ${selectedBot.name}`,
      class: updatedClass,
      bot: {
        id: selectedBot.id,
        name: selectedBot.name,
        wechatId: selectedBot.wechatId,
        groupCount: selectedBot._count.classes + 1
      }
    });
  } catch (error) {
    console.error('自动分配机器人失败:', error);
    return NextResponse.json({ error: '分配失败' }, { status: 500 });
  }
}
