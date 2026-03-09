import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const students = await prisma.student.findMany({
      where: classId ? { classId: parseInt(classId) } : undefined,
      include: { class: true }
    })

    return NextResponse.json(students)
  } catch (_error) {
    return NextResponse.json({ error: '获取学生列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, parentPhone, classId } = await request.json()

    if (!name || !grade || !parentPhone) {
      return NextResponse.json({ error: '学生姓名、年级和家长电话不能为空' }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: { name, grade, parentPhone, classId: classId || null }
    })

    return NextResponse.json(student, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建学生失败' }, { status: 500 })
  }
}
