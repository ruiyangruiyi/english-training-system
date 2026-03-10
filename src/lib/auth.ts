import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_COOKIE = 'session_token'

// 简单 token：base64(userId:timestamp:role)
export function createToken(userId: number, role: string): string {
  const payload = `${userId}:${Date.now()}:${role}`
  return Buffer.from(payload).toString('base64')
}

export function parseToken(token: string): { userId: number; timestamp: number; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [uid, ts, role] = decoded.split(':')
    return { userId: parseInt(uid), timestamp: parseInt(ts), role }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const parsed = parseToken(token)
  if (!parsed) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, username: true, name: true, role: true, status: true }
    })
    if (!user || user.status !== 'active') return null
    return user
  } catch {
    return null
  }
}

export function setSessionCookie(token: string, rememberDays: number = 7) {
  const maxAge = rememberDays * 24 * 60 * 60
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production'
  }
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0
  }
}
