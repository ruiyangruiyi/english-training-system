// ǿ��ʹ�� Node.js ����ʱ
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取老师列表
export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true, username: true, name: true, phone: true,
        wechat: true, subject: true, status: true, role: true,
      },
      orderBy: [{ status: 'asc' }, { id: 'desc' }],
    })
    return NextResponse.json(teachers)
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 新增老师
export async function POST(request: NextRequest) {
  try {
    const { username, password, name, phone, wechat, subject } = await request.json()
    if (!username || !password || !name) {
      return NextResponse.json({ error: '用户名、密码和姓名不能为空' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }
    const user = await prisma.user.create({
      data: {
        username, password, name,
        phone: phone || null, wechat: wechat || null, subject: subject || null,
        status: 'active', role: 'teacher',
      },
    })
    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

// 编辑老师
export async function PUT(request: NextRequest) {
  try {
    const { id, name, password, phone, wechat, subject } = await request.json()
    if (!id || !name) {
      return NextResponse.json({ error: '参数不完�? }, { status: 400 })
    }
    const data: Record<string, string | null> = {
      name, phone: phone || null, wechat: wechat || null, subject: subject || null,
    }
    if (password) data.password = password
    await prisma.user.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// 更新老师状�?export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    if (!id || !status || !['pending', 'active', 'disabled'].includes(status)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }
    await prisma.user.update({ where: { id }, data: { status } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
