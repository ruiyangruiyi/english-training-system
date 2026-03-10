import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/wecom'

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin'

// 推送作业到企业微信群
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const homeworkId = parseInt(id)

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        homeworkClasses: {
          include: { class: true },
        },
      },
    })

    if (!homework) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 })
    }

    const accessToken = await getAccessToken()
    const results: { classId: number; className: string; success: boolean; error?: string }[] = []

    // 向每个关联班级的群发送消息
    for (const hc of homework.homeworkClasses) {
      const cls = hc.class
      if (!cls.wechatGroupId) {
        results.push({ classId: cls.id, className: cls.name, success: false, error: '未关联微信群' })
        continue
      }

      const dueDate = new Date(homework.dueDate).toLocaleDateString('zh-CN')
      const message = `📚【作业通知】

📝 ${homework.title}

${homework.content}

⏰ 截止时间：${dueDate}

完成后请在群里回复"已完成"打卡！`

      const url = `${WECOM_API_BASE}/appchat/send?access_token=${accessToken}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatid: cls.wechatGroupId,
          msgtype: 'text',
          text: { content: message },
        }),
      })

      const data = await response.json()

      if (data.errcode === 0) {
        results.push({ classId: cls.id, className: cls.name, success: true })
      } else {
        results.push({ classId: cls.id, className: cls.name, success: false, error: data.errmsg })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      success: successCount > 0,
      total: results.length,
      successCount,
      results,
    })
  } catch (error) {
    console.error('推送作业失败:', error)
    return NextResponse.json({ error: '推送失败' }, { status: 500 })
  }
}
