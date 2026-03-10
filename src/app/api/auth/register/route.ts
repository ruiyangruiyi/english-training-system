import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, phone, wechat, subject } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json({ error: '用户名、密码和姓名不能为空' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }

    // 创建用户，状态为待审核
    const user = await prisma.user.create({
      data: {
        username,
        password,
        name,
        phone: phone || null,
        wechat: wechat || null,
        subject: subject || null,
        status: 'pending',
        role: 'teacher',
      },
    })

    return NextResponse.json({ id: user.id, message: '注册成功，请等待管理员审核' }, { status: 201 })
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
