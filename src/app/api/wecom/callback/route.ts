import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken, verifyCallback } from '@/lib/wecom'

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin'

// 处理企业微信消息回调
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { MsgType, FromUserName, Content, Event, ChatId, UserName } = body

    // 群聊文本消息
    if (MsgType === 'text' && ChatId) {
      await saveGroupMessage(ChatId, FromUserName, UserName, Content)
      await checkHomeworkMessage(ChatId, FromUserName, Content)
      await checkCompletionMessage(ChatId, FromUserName, UserName, Content)
    }

    // 私聊文本消息 - 对话式建群
    if (MsgType === 'text' && !ChatId) {
      return await handleTextMessage(FromUserName, Content)
    }

    // 事件消息
    if (MsgType === 'event') {
      return await handleEvent(FromUserName, Event, body)
    }

    return NextResponse.json({ errcode: 0, errmsg: 'ok' })
  } catch (error) {
    console.error('处理企业微信回调失败:', error)
    return NextResponse.json({ errcode: -1, errmsg: '处理失败' }, { status: 500 })
  }
}

// 存储群消息
async function saveGroupMessage(chatId: string, userId: string, userName: string | null, content: string) {
  try {
    await prisma.chatMessage.create({
      data: { chatId, userId, userName: userName || null, content, msgType: 'text' },
    })
  } catch (error) {
    console.error('存储消息失败:', error)
  }
}

// 检查作业相关消息 - 自动同步到系统
async function checkHomeworkMessage(chatId: string, userId: string, content: string) {
  const homeworkKeywords = ['作业', 'homework', '今日任务', '练习', '背诵', '【作业】', '[作业]', '📝', '📚']
  const hasKeyword = homeworkKeywords.some(k => content.includes(k))
  if (!hasKeyword || content.length < 10) return

  const cls = await prisma.class.findFirst({ where: { wechatGroupId: chatId } })
  if (!cls) return

  // 解析作业标题（取前50字符或第一行）
  const firstLine = content.split('\n')[0].slice(0, 50)
  const title = firstLine.replace(/^[\[【]?作业[\]】]?[:：]?\s*/i, '') || '微信群作业'

  const homework = await prisma.homework.create({
    data: {
      title,
      content,
      dueDate: parseDueDate(content),
      source: 'wechat',
      originalMessage: content,
    },
  })

  await prisma.homeworkClass.create({
    data: { homeworkId: homework.id, classId: cls.id },
  })

  console.log(`[作业同步] 班级${cls.name}: ${title}`)
}

// 检查完成打卡消息
async function checkCompletionMessage(chatId: string, userId: string, userName: string | null, content: string) {
  const completionKeywords = ['已完成', '完成了', '做完了', 'done', '打卡', '交作业']
  const hasKeyword = completionKeywords.some(k => content.toLowerCase().includes(k))
  if (!hasKeyword) return

  const cls = await prisma.class.findFirst({ where: { wechatGroupId: chatId } })
  if (!cls) return

  const latestHomework = await prisma.homeworkClass.findFirst({
    where: { classId: cls.id },
    orderBy: { homework: { dueDate: 'desc' } },
    include: { homework: true },
  })
  if (!latestHomework) return

  try {
    await prisma.homeworkCompletion.create({
      data: {
        homeworkId: latestHomework.homeworkId,
        wechatUserId: userId,
        wechatName: userName,
      },
    })
    console.log(`[完成打卡] ${userName || userId} 完成了 ${latestHomework.homework.title}`)
  } catch (error) {
    // 已打卡过
  }
}

// 解析截止日期
function parseDueDate(content: string): Date {
  const now = new Date()
  
  // 匹配日期格式：3月15日、3/15、03-15
  const dateMatch = content.match(/(\d{1,2})[月\/\-](\d{1,2})[日号]?/)
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1
    const day = parseInt(dateMatch[2])
    const d = new Date(now.getFullYear(), month, day, 18, 0, 0)
    if (d < now) d.setFullYear(d.getFullYear() + 1)
    return d
  }

  if (content.includes('今天') || content.includes('今晚')) {
    const d = new Date(now)
    d.setHours(22, 0, 0, 0)
    return d
  }
  if (content.includes('明天')) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(18, 0, 0, 0)
    return d
  }
  if (content.includes('后天')) {
    const d = new Date(now)
    d.setDate(d.getDate() + 2)
    d.setHours(18, 0, 0, 0)
    return d
  }
  if (content.includes('周末') || content.includes('周日')) {
    const d = new Date(now)
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7
    d.setDate(d.getDate() + daysUntilSunday)
    d.setHours(18, 0, 0, 0)
    return d
  }

  // 默认明天18点
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(18, 0, 0, 0)
  return d
}

// 处理私聊文本消息 - 对话式建群
async function handleTextMessage(userId: string, content: string) {
  const trimmed = content.trim()

  const session = await prisma.chatSession.findUnique({ where: { userId } })

  // 建群命令
  if (['建群', '创建群', '新建班级'].includes(trimmed)) {
    await prisma.chatSession.upsert({
      where: { userId },
      create: {
        userId,
        sessionType: 'create_group',
        currentStep: 'ask_name',
        data: '{}',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      update: {
        sessionType: 'create_group',
        currentStep: 'ask_name',
        data: '{}',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })
    return sendTextMessage(userId, '🎓 开始创建班级群\n\n请输入班级名称（如：三年级英语A班）：')
  }

  // 取消命令
  if (['取消', '退出'].includes(trimmed) && session) {
    await prisma.chatSession.delete({ where: { userId } })
    return sendTextMessage(userId, '已取消操作。')
  }

  // 处理会话中的消息
  if (session && session.expiresAt > new Date()) {
    const data = JSON.parse(session.data || '{}')

    if (session.sessionType === 'create_group') {
      switch (session.currentStep) {
        case 'ask_name':
          data.name = trimmed
          await prisma.chatSession.update({
            where: { userId },
            data: { currentStep: 'ask_grade', data: JSON.stringify(data) },
          })
          return sendTextMessage(userId, `班级名称：${trimmed}\n\n请输入年级（如：三年级、初一）：`)

        case 'ask_grade':
          data.grade = trimmed
          await prisma.chatSession.update({
            where: { userId },
            data: { currentStep: 'ask_schedule', data: JSON.stringify(data) },
          })
          return sendTextMessage(userId, `年级：${trimmed}\n\n请输入上课时间（如：周六上午9:00）：`)

        case 'ask_schedule':
          data.schedule = trimmed
          await prisma.chatSession.update({
            where: { userId },
            data: { currentStep: 'confirm', data: JSON.stringify(data) },
          })
          return sendTextMessage(userId, 
            `📋 请确认班级信息：\n\n` +
            `班级名称：${data.name}\n` +
            `年级：${data.grade}\n` +
            `上课时间：${data.schedule}\n\n` +
            `回复"确认"创建班级，回复"取消"放弃`)

        case 'confirm':
          if (['确认', '确定', 'ok', 'yes'].includes(trimmed.toLowerCase())) {
            return await createGroupAndClass(userId, data)
          } else {
            await prisma.chatSession.delete({ where: { userId } })
            return sendTextMessage(userId, '已取消创建。')
          }
      }
    }
  }

  // 默认回复
  return sendTextMessage(userId, 
    '👋 你好！我是教学管理助手。\n\n' +
    '📌 可用命令：\n' +
    '• 发送"建群"- 创建新的班级群\n' +
    '• 发送"帮助"- 查看更多功能')
}

// 创建群聊和班级
async function createGroupAndClass(userId: string, data: { name: string; grade: string; schedule: string }) {
  try {
    const accessToken = await getAccessToken()

    // 1. 创建群聊
    const createUrl = `${WECOM_API_BASE}/appchat/create?access_token=${accessToken}`
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        owner: userId,
        userlist: [userId],
      }),
    })
    const createData = await createRes.json()

    if (createData.errcode !== 0) {
      throw new Error(createData.errmsg)
    }

    const chatId = createData.chatid

    // 2. 创建班级记录
    await prisma.class.create({
      data: {
        name: data.name,
        grade: data.grade,
        schedule: data.schedule,
        wechatGroupId: chatId,
        wechatGroupName: data.name,
      },
    })

    // 3. 删除会话
    await prisma.chatSession.delete({ where: { userId } })

    return sendTextMessage(userId,
      `✅ 班级创建成功！\n\n` +
      `📚 ${data.name}\n` +
      `📅 ${data.grade} | ${data.schedule}\n` +
      `🔗 群ID: ${chatId}\n\n` +
      `请在管理后台查看详情。`)
  } catch (error) {
    console.error('创建群聊失败:', error)
    await prisma.chatSession.delete({ where: { userId } }).catch(() => {})
    return sendTextMessage(userId, `❌ 创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 处理事件消息 - 群名双向同步
async function handleEvent(userId: string, event: string, body: any) {
  // 群聊名称变更事件 - 同步到系统
  if (event === 'change_external_chat' && body.ChangeType === 'update_name') {
    const chatId = body.ChatId
    const newName = body.UpdateDetail?.name

    if (chatId && newName) {
      await prisma.class.updateMany({
        where: { wechatGroupId: chatId },
        data: { name: newName, wechatGroupName: newName },
      })
      console.log(`[群名同步] 企微→系统: ${newName}`)
    }
  }

  return NextResponse.json({ errcode: 0, errmsg: 'ok' })
}

// 发送文本消息
async function sendTextMessage(userId: string, content: string) {
  try {
    const accessToken = await getAccessToken()
    const url = `${WECOM_API_BASE}/message/send?access_token=${accessToken}`
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: userId,
        msgtype: 'text',
        agentid: process.env.WECOM_AGENT_ID,
        text: { content },
      }),
    })

    return NextResponse.json({ errcode: 0, errmsg: 'ok' })
  } catch (error) {
    console.error('发送消息失败:', error)
    return NextResponse.json({ errcode: -1, errmsg: '发送失败' }, { status: 500 })
  }
}

// GET 请求用于验证 URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const echostr = searchParams.get('echostr')
  return new NextResponse(echostr)
}
