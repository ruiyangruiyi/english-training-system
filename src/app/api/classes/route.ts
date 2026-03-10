import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制使用 Node.js 运行时
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    console.log('[API /classes] GET request, role:', role, 'teacherId:', teacherId)

    // 构建查询条件
    const where = role === 'admin' || !teacherId 
      ? {} 
      : { teacherId: parseInt(teacherId) }

    console.log('[API /classes] Query where:', JSON.stringify(where))

    const classes = await prisma.class.findMany({
      where,
      include: { 
        _count: { select: { students: true } },
        teacher: { select: { id: true, name: true } }
      }
    })

    console.log('[API /classes] Found', classes.length, 'classes')
    return NextResponse.json(classes)
  } catch (error) {
    console.error('[API /classes] Error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({ 
      error: '获取班级列表失败', 
      message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined
    }, { status: 500 })
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
