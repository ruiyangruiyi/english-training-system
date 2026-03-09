import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name
    })
  } catch (_error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
