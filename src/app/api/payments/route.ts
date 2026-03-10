// ǿ��ʹ�� Node.js ����ʱ
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const term = searchParams.get('term')
    const status = searchParams.get('status')
    const teacherId = searchParams.get('teacherId')
    const role = searchParams.get('role')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = parseInt(studentId)
    if (term) where.term = term
    if (status) where.status = status
    
    // 老师只能看自己班级学生的缴费
    if (role !== 'admin' && teacherId) {
      where.student = { class: { teacherId: parseInt(teacherId) } }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { 
        student: { 
          include: { 
            class: {
              include: { teacher: { select: { id: true, name: true } } }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (_error) {
    return NextResponse.json({ error: '获取缴费记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, term, status, amount } = await request.json()

    if (!studentId || !term || !status) {
      return NextResponse.json({ error: '参数不完�? }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: { studentId, term, status, amount: amount || null }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建缴费记录失败' }, { status: 500 })
  }
}
