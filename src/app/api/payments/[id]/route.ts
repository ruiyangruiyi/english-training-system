import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { student: true }
    })

    if (!payment) {
      return NextResponse.json({ error: '缴费记录不存在' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (_error) {
    return NextResponse.json({ error: '获取缴费记录失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { status, amount, paymentMethod, paidAt } = await request.json()

    const updated = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status,
        amount: amount || null,
        paymentMethod: paymentMethod || null,
        paidAt: paidAt ? new Date(paidAt) : null
      }
    })

    return NextResponse.json(updated)
  } catch (_error) {
    return NextResponse.json({ error: '更新缴费记录失败' }, { status: 500 })
  }
}
