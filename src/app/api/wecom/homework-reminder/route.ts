import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken, WECOM_API_BASE } from '@/lib/wecom'

// 发送作业提醒
export async function POST(request: NextRequest) {
  try {
    const { homeworkId } = await request.json()

    if (!homeworkId) {
      return NextResponse.json({ error: '缺少作业ID' }, { status: 400 })
    }

    // 获取作业信息
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        homeworkClasses: {
          include: {
            class: true,
          },
        },
      },
    })

    if (!homework) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 })
    }

    const accessToken = await getAccessToken()
    const results = []

    // 向每个班级群发送提醒
    for (const hwClass of homework.homeworkClasses) {
      const classInfo = hwClass.class
      
      if (!classInfo.wechatGroupId) {
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          success: false,
          error: '班级未关联微信群',
        })
        continue
      }

      try {
        // 发送群消息
        const url = `${WECOM_API_BASE}/appchat/send?access_token=${accessToken}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatid: classInfo.wechatGroupId,
            msgtype: 'text',
            text: {
              content: `📝 作业提醒\n\n标题：${homework.title}\n内容：${homework.content}\n截止时间：${new Date(homework.dueDate).toLocaleDateString()}\n\n请同学们按时完成作业，完成后回复"已完成"。`,
            },
          }),
        })

        const data = await response.json()

        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          success: data.errcode === 0,
          error: data.errcode !== 0 ? data.errmsg : null,
        })
      } catch (error) {
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          success: false,
          error: error instanceof Error ? error.message : '发送失败',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('发送作业提醒失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发送失败' },
      { status: 500 }
    )
  }
}
