import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: { _count: { select: { students: true } } }
    })
    return NextResponse.json(classes)
  } catch (_error) {
    return NextResponse.json({ error: '获取班级列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, schedule } = await request.json()

    if (!name || !grade || !schedule) {
      return NextResponse.json({ error: '班级名称、年级和课程安排不能为空' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: { name, grade, schedule }
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建班级失败' }, { status: 500 })
  }
}
