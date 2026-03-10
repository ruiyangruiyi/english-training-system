import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js 运行时
export const runtime = 'nodejs'

// 延迟导入prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  return prisma
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    console.log('[API /classes] GET, role:', role, 'TURSO_URL exists:', !!process.env.TURSO_DATABASE_URL)

    const prisma = await getPrisma()

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

    console.log('[API /classes] Found', classes.length, 'classes')
    return NextResponse.json(classes)
  } catch (error) {
    console.error('[API /classes] Error:', error)
    return NextResponse.json({ 
      error: '获取班级列表失败', 
      message: error instanceof Error ? error.message : String(error),
      envCheck: { hasTursoUrl: !!process.env.TURSO_DATABASE_URL, hasTursoToken: !!process.env.TURSO_AUTH_TOKEN }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, schedule, teacherId } = await request.json()

    if (!name || !grade || !schedule) {
      return NextResponse.json({ error: '班级名称、年级和课程安排不能为空' }, { status: 400 })
    }

    const prisma = await getPrisma()

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
  } catch (error) {
    console.error('[API /classes] POST Error:', error)
    return NextResponse.json({ error: '创建班级失败' }, { status: 500 })
  }
}
