import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/classes/:id/bindgroup - 绑定微信群到班级
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classId = parseInt(params.id);
    const { wechatGroupId, wechatGroupName } = await request.json();

    if (!wechatGroupId) {
      return NextResponse.json({ error: '微信群ID不能为空' }, { status: 400 });
    }

    // 检查班级是否存在
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 });
    }

    // 检查该微信群是否已绑定其他班级
    const boundClass = await prisma.class.findFirst({
      where: {
        wechatGroupId,
        id: { not: classId },
      },
    });

    if (boundClass) {
      return NextResponse.json(
        { error: `该微信群已绑定到班级: ${boundClass.name}` },
        { status: 400 }
      );
    }

    // 更新班级的微信群绑定
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        wechatGroupId,
        wechatGroupName: wechatGroupName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '微信群绑定成功',
      class: updatedClass,
    });
  } catch (error) {
    console.error('绑定微信群失败:', error);
    return NextResponse.json({ error: '绑定失败' }, { status: 500 });
  }
}

// DELETE /api/classes/:id/bindgroup - 解绑微信群
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classId = parseInt(params.id);

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        wechatGroupId: null,
        wechatGroupName: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '微信群解绑成功',
      class: updatedClass,
    });
  } catch (error) {
    console.error('解绑微信群失败:', error);
    return NextResponse.json({ error: '解绑失败' }, { status: 500 });
  }
}
