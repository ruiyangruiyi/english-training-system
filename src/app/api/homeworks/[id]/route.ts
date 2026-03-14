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

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, dueDate, classIds } = body

    // 验证作业是否存在
    const existing = await prisma.homework.findUnique({
      where: { id: parseInt(id) }
    })
    if (!existing) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 })
    }

    // 更新作业基本信息
    const homework = await prisma.homework.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      }
    })

    // 如果提供了 classIds，更新班级关联
    if (classIds && Array.isArray(classIds)) {
      // 删除旧的关联
      await prisma.homeworkClass.deleteMany({
        where: { homeworkId: parseInt(id) }
      })
      // 创建新的关联
      await prisma.homeworkClass.createMany({
        data: classIds.map((classId: number) => ({
          homeworkId: parseInt(id),
          classId
        }))
      })
    }

    // 返回更新后的完整数据
    const updated = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: { homeworkClasses: { include: { class: true } } }
    })

    return NextResponse.json(updated)
  } catch (_error) {
    return NextResponse.json({ error: '更新作业失败' }, { status: 500 })
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
