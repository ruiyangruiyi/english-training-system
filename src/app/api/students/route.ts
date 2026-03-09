import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    // 构建查询条件
    let where: any = {}
    
    if (classId) {
      where.classId = parseInt(classId)
    } else if (role !== 'admin' && teacherId) {
      // 老师只能看自己班级的学生
      where.class = { teacherId: parseInt(teacherId) }
    }

    const students = await prisma.student.findMany({
      where,
      include: { 
        class: {
          include: { teacher: { select: { id: true, name: true } } }
        }
      }
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
