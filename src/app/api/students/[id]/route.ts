import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { class: true, payments: true }
    })

    if (!student) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (_error) {
    return NextResponse.json({ error: '获取学生详情失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { name, grade, parentPhone, classId } = await request.json()

    const updated = await prisma.student.update({
      where: { id: parseInt(id) },
      data: { name, grade, parentPhone, classId: classId || null }
    })

    return NextResponse.json(updated)
  } catch (_error) {
    return NextResponse.json({ error: '更新学生失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.student.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '删除学生失败' }, { status: 500 })
  }
}
