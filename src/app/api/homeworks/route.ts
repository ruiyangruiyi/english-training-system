// ǿ��ʹ�� Node.js ����ʱ
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    let where: any = undefined
    
    if (classId) {
      where = { homeworkClasses: { some: { classId: parseInt(classId) } } }
    } else if (role !== 'admin' && teacherId) {
      // 老师只能看自己班级的作业
      where = { 
        homeworkClasses: { 
          some: { class: { teacherId: parseInt(teacherId) } } 
        } 
      }
    }

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        homeworkClasses: { 
          include: { 
            class: {
              include: { teacher: { select: { id: true, name: true } } }
            }
          }
        }
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
      return NextResponse.json({ error: '参数不完�? }, { status: 400 })
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
