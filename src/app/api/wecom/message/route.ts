import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * POST /api/wecom/message - 接收云函数转发的解密后消息
 * 
 * 消息格式（XML）：
 * <xml>
 *   <ToUserName>企业ID</ToUserName>
 *   <FromUserName>发送者UserID</FromUserName>
 *   <CreateTime>时间戳</CreateTime>
 *   <MsgType>text/image/event等</MsgType>
 *   <Content>文本内容</Content>
 *   <MsgId>消息ID</MsgId>
 *   <AgentID>应用ID</AgentID>
 * </xml>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log('[WeCom Message] 收到消息:', body)

    // 解析XML
    const msg = parseXML(body)
    console.log('[WeCom Message] 解析结果:', msg)

    const { MsgType, FromUserName, Content, AgentID, Event, EventKey } = msg

    // 文本消息
    if (MsgType === 'text' && Content) {
      return await handleTextMessage(FromUserName, Content)
    }

    // 事件消息
    if (MsgType === 'event') {
      return await handleEvent(FromUserName, Event, EventKey, msg)
    }

    // 其他消息类型
    console.log('[WeCom Message] 未处理的消息类型:', MsgType)
    return new NextResponse('success')
  } catch (error) {
    console.error('[WeCom Message] 处理失败:', error)
    return new NextResponse('success') // 企业微信要求返回success
  }
}

// 解析XML
function parseXML(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3]
    const value = match[2] || match[4]
    result[key] = value
  }
  return result
}

// 处理文本消息
async function handleTextMessage(userId: string, content: string) {
  const trimmed = content.trim()
  console.log('[WeCom Message] 文本消息:', userId, trimmed)

  // 查询会话状态
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
    return replyText(userId, '🎓 开始创建班级群\n\n请输入班级名称（如：三年级英语A班）：')
  }

  // 取消命令
  if (['取消', '退出'].includes(trimmed) && session) {
    await prisma.chatSession.delete({ where: { userId } })
    return replyText(userId, '已取消操作。')
  }

  // 帮助命令
  if (['帮助', 'help', '?', '？'].includes(trimmed)) {
    return replyText(userId, 
      '👋 你好！我是教学管理助手。\n\n' +
      '📌 可用命令：\n' +
      '• 发送"建群"- 创建新的班级群\n' +
      '• 发送"取消"- 取消当前操作\n' +
      '• 发送"帮助"- 查看帮助信息')
  }

  // 处理会话中的消息
  if (session && session.expiresAt > new Date()) {
    return await handleSessionMessage(userId, trimmed, session)
  }

  // 默认回复
  return replyText(userId, 
    '👋 你好！我是教学管理助手。\n\n' +
    '发送"建群"开始创建班级群\n' +
    '发送"帮助"查看更多功能')
}

// 处理会话消息
async function handleSessionMessage(userId: string, content: string, session: any) {
  const data = JSON.parse(session.data || '{}')

  if (session.sessionType === 'create_group') {
    switch (session.currentStep) {
      case 'ask_name':
        data.name = content
        await prisma.chatSession.update({
          where: { userId },
          data: { currentStep: 'ask_grade', data: JSON.stringify(data) },
        })
        return replyText(userId, `班级名称：${content}\n\n请输入年级（如：三年级、初一）：`)

      case 'ask_grade':
        data.grade = content
        await prisma.chatSession.update({
          where: { userId },
          data: { currentStep: 'ask_schedule', data: JSON.stringify(data) },
        })
        return replyText(userId, `年级：${content}\n\n请输入上课时间（如：周六上午9:00）：`)

      case 'ask_schedule':
        data.schedule = content
        await prisma.chatSession.update({
          where: { userId },
          data: { currentStep: 'confirm', data: JSON.stringify(data) },
        })
        return replyText(userId, 
          `📋 请确认班级信息：\n\n` +
          `班级名称：${data.name}\n` +
          `年级：${data.grade}\n` +
          `上课时间：${data.schedule}\n\n` +
          `回复"确认"创建班级，回复"取消"放弃`)

      case 'confirm':
        if (['确认', '确定', 'ok', 'yes'].includes(content.toLowerCase())) {
          // 创建班级
          const newClass = await prisma.class.create({
            data: {
              name: data.name,
              grade: data.grade,
              schedule: data.schedule,
            },
          })
          await prisma.chatSession.delete({ where: { userId } })
          return replyText(userId,
            `✅ 班级创建成功！\n\n` +
            `📚 ${data.name}\n` +
            `📅 ${data.grade} | ${data.schedule}\n` +
            `🆔 班级ID: ${newClass.id}\n\n` +
            `请在管理后台查看详情。`)
        } else {
          await prisma.chatSession.delete({ where: { userId } })
          return replyText(userId, '已取消创建。')
        }
    }
  }

  return replyText(userId, '操作已过期，请重新开始。')
}

// 处理事件消息
async function handleEvent(userId: string, event: string, eventKey: string, msg: any) {
  console.log('[WeCom Message] 事件:', event, eventKey)

  // 关注事件
  if (event === 'subscribe') {
    return replyText(userId, 
      '👋 欢迎使用教学管理助手！\n\n' +
      '发送"建群"开始创建班级群\n' +
      '发送"帮助"查看更多功能')
  }

  // 点击菜单事件
  if (event === 'click') {
    if (eventKey === 'create_group') {
      return await handleTextMessage(userId, '建群')
    }
  }

  return new NextResponse('success')
}

// 回复文本消息（被动回复）
function replyText(userId: string, content: string) {
  // 企业微信被动回复需要返回XML格式
  // 但如果是通过云函数转发的，直接返回success，由云函数处理回复
  console.log('[WeCom Message] 回复:', userId, content)
  
  // 异步发送主动消息
  sendActiveMessage(userId, content).catch(err => {
    console.error('[WeCom Message] 发送主动消息失败:', err)
  })

  return new NextResponse('success')
}

// 发送主动消息
async function sendActiveMessage(userId: string, content: string) {
  const corpId = process.env.WECOM_CORP_ID
  const secret = process.env.WECOM_SECRET
  const agentId = process.env.WECOM_AGENT_ID

  if (!corpId || !secret || !agentId) {
    console.log('[WeCom Message] 缺少配置，跳过主动消息')
    return
  }

  // 获取 access_token
  const tokenRes = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${secret}`
  )
  const tokenData = await tokenRes.json()
  
  if (tokenData.errcode !== 0) {
    throw new Error(`获取token失败: ${tokenData.errmsg}`)
  }

  // 发送消息
  const sendRes = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: userId,
        msgtype: 'text',
        agentid: agentId,
        text: { content },
      }),
    }
  )
  const sendData = await sendRes.json()
  
  if (sendData.errcode !== 0) {
    throw new Error(`发送消息失败: ${sendData.errmsg}`)
  }

  console.log('[WeCom Message] 主动消息发送成功')
}
