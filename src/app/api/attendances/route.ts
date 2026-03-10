import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    const where: Record<string, unknown> = {}
    if (classId) where.classId = parseInt(classId)
    if (studentId) where.studentId = parseInt(studentId)
    
    // 按日期范围查询（当天 00:00 到 23:59:59）
    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      where.date = { gte: dayStart, lte: dayEnd }
    }
    
    // 老师只能看自己班级的考勤
    if (role !== 'admin' && teacherId) {
      where.class = { teacherId: parseInt(teacherId) }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { 
        student: true, 
        class: {
          include: { teacher: { select: { id: true, name: true } } }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(attendances)
  } catch (_error) {
    return NextResponse.json({ error: '获取考勤记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { classId, date, records } = await request.json()

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    // 删除当天该班级的旧记录
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    await prisma.attendance.deleteMany({
      where: { 
        classId, 
        date: { gte: dayStart, lte: dayEnd }
      }
    })

    // 批量创建新记录（支持remark字段）
    const attendances = await prisma.attendance.createMany({
      data: records.map((r: { studentId: number; status: string; remark?: string }) => ({
        classId,
        studentId: r.studentId,
        date: new Date(date),
        status: r.status,
        remark: (r.status === 'leave' || r.status === 'absent') ? (r.remark || null) : null
      }))
    })

    return NextResponse.json({ count: attendances.count }, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '保存考勤记录失败' }, { status: 500 })
  }
}
