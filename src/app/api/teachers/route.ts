import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teachers - 获取老师列表
export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        username: true,
        name: true,
        _count: { select: { classes: true } }
      }
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('获取老师列表失败:', error);
    return NextResponse.json({ error: '获取老师列表失败' }, { status: 500 });
  }
}
