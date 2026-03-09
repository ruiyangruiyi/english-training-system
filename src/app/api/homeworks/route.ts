import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const homeworks = await prisma.homework.findMany({
      where: classId ? {
        homeworkClasses: { some: { classId: parseInt(classId) } }
      } : undefined,
      include: {
        homeworkClasses: { include: { class: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(homeworks)
  } catch (_error) {
    return NextResponse.json({ error: '获取作业列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, dueDate, classIds } = await request.json()

    if (!title || !content || !dueDate || !classIds || !Array.isArray(classIds)) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const homework = await prisma.homework.create({
      data: {
        title,
        content,
        dueDate: new Date(dueDate),
        homeworkClasses: {
          create: classIds.map((classId: number) => ({ classId }))
        }
      },
      include: { homeworkClasses: { include: { class: true } } }
    })

    return NextResponse.json(homework, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建作业失败' }, { status: 500 })
  }
}
