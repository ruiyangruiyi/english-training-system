import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bots/:id - 获取单个机器人详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = parseInt(params.id);

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
            wechatGroupId: true,
            wechatGroupName: true
          }
        }
      }
    });

    if (!bot) {
      return NextResponse.json({ error: '机器人不存在' }, { status: 404 });
    }

    return NextResponse.json(bot);
  } catch (error) {
    console.error('获取机器人详情失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// PUT /api/bots/:id - 更新机器人状态
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = parseInt(params.id);
    const body = await request.json();
    const { status, serverIp, heartbeat, maxGroups, name } = body;

    const updateData: any = {};

    if (status) updateData.status = status;
    if (serverIp !== undefined) updateData.serverIp = serverIp;
    if (maxGroups) updateData.maxGroups = maxGroups;
    if (name) updateData.name = name;
    
    // 心跳更新
    if (heartbeat) {
      updateData.lastHeartbeat = new Date();
      updateData.status = 'online';
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: updateData,
      include: {
        _count: { select: { classes: true } }
      }
    });

    return NextResponse.json({
      ...bot,
      groupCount: bot._count.classes
    });
  } catch (error) {
    console.error('更新机器人失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/bots/:id - 删除机器人
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = parseInt(params.id);

    // 检查是否有绑定的群
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { _count: { select: { classes: true } } }
    });

    if (!bot) {
      return NextResponse.json({ error: '机器人不存在' }, { status: 404 });
    }

    if (bot._count.classes > 0) {
      return NextResponse.json(
        { error: `该机器人还有 ${bot._count.classes} 个群绑定，请先解绑` },
        { status: 400 }
      );
    }

    await prisma.bot.delete({ where: { id: botId } });

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除机器人失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
