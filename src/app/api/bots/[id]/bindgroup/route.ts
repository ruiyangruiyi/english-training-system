import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/bots/:id/bindgroup - 绑定群到机器人
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = parseInt(params.id);
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: '班级ID不能为空' }, { status: 400 });
    }

    // 检查机器人是否存在
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { _count: { select: { classes: true } } }
    });

    if (!bot) {
      return NextResponse.json({ error: '机器人不存在' }, { status: 404 });
    }

    // 检查是否超过最大群数限制
    if (bot._count.classes >= bot.maxGroups) {
      return NextResponse.json(
        { error: `该机器人已达到最大群数限制 (${bot.maxGroups})` },
        { status: 400 }
      );
    }

    // 检查班级是否存在
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 });
    }

    // 更新班级的机器人绑定
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { botId },
      include: {
        bot: { select: { id: true, name: true, wechatId: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: '绑定成功',
      class: updatedClass
    });
  } catch (error) {
    console.error('绑定群到机器人失败:', error);
    return NextResponse.json({ error: '绑定失败' }, { status: 500 });
  }
}

// DELETE /api/bots/:id/bindgroup - 解绑群
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: '班级ID不能为空' }, { status: 400 });
    }

    const updatedClass = await prisma.class.update({
      where: { id: parseInt(classId) },
      data: { botId: null }
    });

    return NextResponse.json({
      success: true,
      message: '解绑成功',
      class: updatedClass
    });
  } catch (error) {
    console.error('解绑群失败:', error);
    return NextResponse.json({ error: '解绑失败' }, { status: 500 });
  }
}
