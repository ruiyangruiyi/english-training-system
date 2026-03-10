import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 完成关键词
const COMPLETE_KEYWORDS = ['已完成', '完成了', '做完了', 'done', '交了', '已交'];

// POST /api/wecom/homework-complete - 处理学生完成回复
export async function POST(request: NextRequest) {
  try {
    const { chatId, content, userId, userName } = await request.json();

    if (!chatId || !content || !userId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 检查是否是完成回复
    const isComplete = COMPLETE_KEYWORDS.some(kw => 
      content.toLowerCase().includes(kw.toLowerCase())
    );

    if (!isComplete) {
      return NextResponse.json({
        success: true,
        isComplete: false,
        message: '非完成回复'
      });
    }

    // 查找关联的班级
    const classItem = await prisma.class.findFirst({
      where: { wechatGroupId: chatId }
    });

    if (!classItem) {
      return NextResponse.json({
        success: false,
        message: '未找到关联班级'
      });
    }

    // 查找该班级最近的未截止作业
    const now = new Date();
    const latestHomework = await prisma.homework.findFirst({
      where: {
        dueDate: { gte: now },
        homeworkClasses: {
          some: { classId: classItem.id }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    if (!latestHomework) {
      return NextResponse.json({
        success: true,
        isComplete: true,
        message: '没有待完成的作业',
        recorded: false
      });
    }

    // 记录完成状态（防重复）
    const existing = await prisma.homeworkCompletion.findUnique({
      where: {
        homeworkId_wechatUserId: {
          homeworkId: latestHomework.id,
          wechatUserId: userId
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        isComplete: true,
        message: '已记录过完成状态',
        recorded: false,
        homework: latestHomework.title
      });
    }

    // 创建完成记录
    await prisma.homeworkCompletion.create({
      data: {
        homeworkId: latestHomework.id,
        wechatUserId: userId,
        wechatName: userName || null
      }
    });

    return NextResponse.json({
      success: true,
      isComplete: true,
      message: '已记录完成',
      recorded: true,
      homework: latestHomework.title
    });

  } catch (error) {
    console.error('记录作业完成失败:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
}

// GET /api/wecom/homework-complete - 获取作业完成统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get('homeworkId');
    const classId = searchParams.get('classId');

    if (!homeworkId) {
      return NextResponse.json({ error: '缺少homeworkId' }, { status: 400 });
    }

    // 获取作业信息
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(homeworkId) },
      include: {
        homeworkClasses: {
          include: {
            class: {
              include: {
                students: true
              }
            }
          }
        },
        completions: true
      }
    });

    if (!homework) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 });
    }

    // 计算统计
    const classes = homework.homeworkClasses
      .filter(hc => !classId || hc.classId === parseInt(classId))
      .map(hc => {
        const studentCount = hc.class.students.length;
        const completedCount = homework.completions.length; // 简化：实际应按班级统计
        
        return {
          classId: hc.class.id,
          className: hc.class.name,
          studentCount,
          completedCount,
          completionRate: studentCount > 0 
            ? Math.round((completedCount / studentCount) * 100) 
            : 0
        };
      });

    return NextResponse.json({
      homework: {
        id: homework.id,
        title: homework.title,
        dueDate: homework.dueDate
      },
      totalCompletions: homework.completions.length,
      completions: homework.completions.map(c => ({
        wechatUserId: c.wechatUserId,
        wechatName: c.wechatName,
        completedAt: c.completedAt
      })),
      classes
    });

  } catch (error) {
    console.error('获取完成统计失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
