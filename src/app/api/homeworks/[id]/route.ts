import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: { homeworkClasses: { include: { class: true } } }
    })

    if (!homework) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 })
    }

    return NextResponse.json(homework)
  } catch (_error) {
    return NextResponse.json({ error: '获取作业详情失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.homeworkClass.deleteMany({ where: { homeworkId: parseInt(id) } })
    await prisma.homework.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '删除作业失败' }, { status: 500 })
  }
}
