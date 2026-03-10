import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取班级微信群信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const classId = parseInt(id)

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        wechatGroupId: true,
        wechatGroupName: true,
        reminderEnabled: true,
        reminderTime: true,
        _count: { select: { students: true } },
      },
    })

    if (!cls) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    return NextResponse.json({
      groupId: cls.wechatGroupId,
      groupName: cls.wechatGroupName,
      qrCodeUrl: cls.wechatGroupId ? `/api/classes/${classId}/wechat/qrcode` : null,
      memberCount: cls._count.students,
      reminderEnabled: cls.reminderEnabled,
      reminderTime: cls.reminderTime,
    })
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
