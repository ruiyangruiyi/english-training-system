import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 更新提醒设置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const classId = parseInt(id)
    const { enabled, time } = await request.json()

    await prisma.class.update({
      where: { id: classId },
      data: {
        reminderEnabled: enabled,
        reminderTime: time || '20:00',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
