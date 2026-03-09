import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: { students: true }
    })

    if (!classItem) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    return NextResponse.json(classItem)
  } catch (_error) {
    return NextResponse.json({ error: '获取班级详情失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { name, grade, schedule } = await request.json()

    const updated = await prisma.class.update({
      where: { id: parseInt(id) },
      data: { name, grade, schedule }
    })

    return NextResponse.json(updated)
  } catch (_error) {
    return NextResponse.json({ error: '更新班级失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.class.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '删除班级失败' }, { status: 500 })
  }
}
