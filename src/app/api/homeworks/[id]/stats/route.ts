import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/homeworks/[id]/stats - 作业完成统计
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const homeworkId = parseInt(id);

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        homeworkClasses: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
          },
        },
        completions: true,
      },
    });

    if (!homework) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 });
    }

    // 统计各班级完成情况
    const classStats = homework.homeworkClasses.map(hc => {
      const totalStudents = hc.class.students.length;
      const completedCount = homework.completions.filter(c => {
        // 这里简化处理，实际需要关联学生和微信用户
        return true;
      }).length;

      return {
        classId: hc.class.id,
        className: hc.class.name,
        totalStudents,
        completedCount: Math.min(completedCount, totalStudents),
        completionRate: totalStudents > 0 
          ? Math.round((Math.min(completedCount, totalStudents) / totalStudents) * 100) 
          : 0,
      };
    });

    // 完成详情
    const completions = homework.completions.map(c => ({
      wechatUserId: c.wechatUserId,
      wechatName: c.wechatName,
      completedAt: c.completedAt,
    }));

    // 总体统计
    const totalStudents = classStats.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalCompleted = homework.completions.length;

    return NextResponse.json({
      homeworkId: homework.id,
      title: homework.title,
      dueDate: homework.dueDate,
      totalStudents,
      totalCompleted,
      overallRate: totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0,
      classStats,
      completions,
    });
  } catch (error) {
    console.error('获取作业统计失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
