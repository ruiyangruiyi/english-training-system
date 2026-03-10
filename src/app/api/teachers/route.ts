import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取老师列表
export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        wechat: true,
        subject: true,
        status: true,
        role: true,
      },
      orderBy: [
        { status: 'asc' }, // pending 排前面
        { id: 'desc' },
      ],
    })
    return NextResponse.json(teachers)
  } catch (error) {
    console.error('获取老师列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 更新老师状态
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    if (!['pending', 'active', 'disabled'].includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (error) {
    console.error('更新老师状态失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
