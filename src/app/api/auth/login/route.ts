import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberDays } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: '账号待审核，请联系管理员' }, { status: 403 })
    }

    if (user.status === 'disabled') {
      return NextResponse.json({ error: '账号已被禁用，请联系管理员' }, { status: 403 })
    }

    const token = createToken(user.id, user.role)
    const days = rememberDays === 30 ? 30 : 7
    const cookie = setSessionCookie(token, days)

    const res = NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    })
    res.cookies.set(cookie)
    return res
  } catch (_error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
