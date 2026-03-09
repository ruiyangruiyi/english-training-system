import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const term = searchParams.get('term')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = parseInt(studentId)
    if (term) where.term = term
    if (status) where.status = status

    const payments = await prisma.payment.findMany({
      where,
      include: { student: { include: { class: true } } },
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
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: { studentId, term, status, amount: amount || null }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '创建缴费记录失败' }, { status: 500 })
  }
}
