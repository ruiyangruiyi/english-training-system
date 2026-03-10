import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取群聊分析摘要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const classId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // 格式: 2026-03

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { wechatGroupId: true },
    })

    if (!cls || !cls.wechatGroupId) {
      return NextResponse.json([])
    }

    // 计算日期范围
    let startDate: Date, endDate: Date
    if (month) {
      const [year, mon] = month.split('-').map(Number)
      startDate = new Date(year, mon - 1, 1)
      endDate = new Date(year, mon, 0, 23, 59, 59)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // 获取摘要
    const summaries = await prisma.chatSummary.findMany({
      where: {
        chatId: cls.wechatGroupId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    })

    // 获取每天的原始消息（最多20条）
    const result = await Promise.all(
      summaries.map(async (s) => {
        const dayStart = new Date(s.date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(s.date)
        dayEnd.setHours(23, 59, 59, 999)

        const messages = await prisma.chatMessage.findMany({
          where: {
            chatId: cls.wechatGroupId!,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        })

        // 解析摘要中的话题（假设摘要格式包含话题）
        const topics = extractTopics(s.summary)

        return {
          id: s.id,
          date: s.date.toISOString().split('T')[0],
          summary: s.summary,
          messageCount: s.messageCount,
          activeMembers: new Set(messages.map(m => m.userId)).size,
          topics,
          messages: messages.map(m => ({
            time: m.createdAt.toTimeString().slice(0, 5),
            sender: m.userName || m.userId,
            content: m.content,
          })),
        }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取群聊摘要失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 从摘要中提取话题
function extractTopics(summary: string): string[] {
  const topics: string[] = []
  
  // 简单的关键词提取
  const keywords = ['作业', '考试', '复习', '预习', '背诵', '阅读', '听力', '口语', '语法', '单词']
  keywords.forEach(k => {
    if (summary.includes(k)) topics.push(k)
  })

  return topics.slice(0, 5)
}
