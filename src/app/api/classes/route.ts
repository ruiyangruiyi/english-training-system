import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制使用 Node.js 运行时
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    // 构建查询条件
    const where = role === 'admin' || !teacherId 
      ? {} 
      : { teacherId: parseInt(teacherId) }

    const classes = await prisma.class.findMany({
      where,
      include: { 
        _count: { select: { students: true } },
        teacher: { select: { id: true, name: true } }
      }
    })
    return NextResponse.json(classes)
  } catch (error) {
    console.error('获取班级列表失败:', error)
    return NextResponse.json({ error: '获取班级列表失败', detail: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, schedule, teacherId } = await request.json()

    if (!name || !grade || !schedule) {
      return NextResponse.json({ error: '班级名称、年级和课程安排不能为空' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: { 
        name, 
        grade, 
        schedule,
        teacherId: teacherId ? parseInt(teacherId) : null
      },
      include: {
        teacher: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建班级失败' }, { status: 500 })
  }
}
