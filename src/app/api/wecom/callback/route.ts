import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken, WECOM_API_BASE } from '@/lib/wecom'

// 处理企业微信消息回调
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 解析消息
    const { MsgType, FromUserName, Content, Event } = body

    // 文本消息
    if (MsgType === 'text') {
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

// 处理文本消息
async function handleTextMessage(userId: string, content: string) {
  const trimmedContent = content.trim()

  // 检查是否有进行中的会话
  const session = await prisma.chatSession.findUnique({
    where: { userId },
  })

  // 建群命令
  if (trimmedContent === '建群' || trimmedContent === '创建群') {
    // 创建新会话
    await prisma.chatSession.upsert({
      where: { userId },
      create: {
        userId,
        sessionType: 'create_group',
        currentStep: 'ask_name',
        data: '{}',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
      },
      update: {
        sessionType: 'create_group',
        currentStep: 'ask_name',
        data: '{}',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    return sendTextMessage(userId, '请输入班级名称：')
  }

  // 处理会话中的消息
  if (session && session.expiresAt > new Date()) {
    if (session.sessionType === 'create_group' && session.currentStep === 'ask_name') {
      return await handleCreateGroup(userId, trimmedContent)
    }
  }

  // 默认回复
  return sendTextMessage(userId, '你好！我是英语培训班助手。\n\n发送"建群"可以创建新的班级群。')
}

// 处理事件消息
async function handleEvent(userId: string, event: string, body: any) {
  // 群聊名称变更事件
  if (event === 'change_external_chat' && body.ChangeType === 'update_name') {
    const chatId = body.ChatId
    const newName = body.UpdateDetail?.name

    if (chatId && newName) {
      // 更新数据库中的班级名称
      await prisma.class.updateMany({
        where: { wechatGroupId: chatId },
        data: { name: newName, wechatGroupName: newName },
      })
    }
  }

  return NextResponse.json({ errcode: 0, errmsg: 'ok' })
}

// 处理建群流程
async function handleCreateGroup(userId: string, className: string) {
  try {
    // 获取用户信息（假设 userId 就是 teacherId）
    // 实际应该通过企业微信 API 获取用户信息并匹配到系统用户
    
    // 创建班级
    const newClass = await prisma.class.create({
      data: {
        name: className,
        grade: '待补充',
        schedule: '待补充',
        teacherId: null, // 需要关联到实际老师
      },
    })

    // 调用企业微信 API 创建群聊
    const accessToken = await getAccessToken()
    
    // 1. 创建群聊
    const createGroupUrl = `${WECOM_API_BASE}/appchat/create?access_token=${accessToken}`
    const createGroupResponse = await fetch(createGroupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: className,
        owner: userId,
        userlist: [userId],
      }),
    })
    const createGroupData = await createGroupResponse.json()

    if (createGroupData.errcode !== 0) {
      throw new Error(`创建群聊失败: ${createGroupData.errmsg}`)
    }

    const chatId = createGroupData.chatid

    // 2. 配置加入群聊方式并获取二维码
    const addJoinWayUrl = `${WECOM_API_BASE}/externalcontact/groupchat/add_join_way?access_token=${accessToken}`
    const addJoinWayResponse = await fetch(addJoinWayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene: 2, // 二维码
        remark: `${className}入群二维码`,
        auto_create_room: 1,
        room_base_name: className,
        chat_id_list: [chatId],
      }),
    })
    const addJoinWayData = await addJoinWayResponse.json()

    if (addJoinWayData.errcode !== 0) {
      throw new Error(`获取二维码失败: ${addJoinWayData.errmsg}`)
    }

    const qrCodeUrl = addJoinWayData.config_id

    // 更新班级信息
    await prisma.class.update({
      where: { id: newClass.id },
      data: {
        wechatGroupId: chatId,
        wechatGroupName: className,
      },
    })

    // 删除会话
    await prisma.chatSession.delete({ where: { userId } })

    // 发送成功消息和二维码
    return sendTextMessage(
      userId,
      `✅ 班级"${className}"创建成功！\n\n群ID: ${chatId}\n\n请在管理后台补充年级和上课时间信息。`
    )
  } catch (error) {
    console.error('创建群聊失败:', error)
    await prisma.chatSession.delete({ where: { userId } }).catch(() => {})
    return sendTextMessage(userId, `❌ 创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
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
        text: {
          content,
        },
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
  const signature = searchParams.get('msg_signature')
  const timestamp = searchParams.get('timestamp')
  const nonce = searchParams.get('nonce')
  const echostr = searchParams.get('echostr')

  // TODO: 验证签名
  // 这里需要实现企业微信的签名验证逻辑

  return new NextResponse(echostr)
}
