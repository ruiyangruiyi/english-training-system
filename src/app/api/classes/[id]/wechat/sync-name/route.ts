import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/wecom'

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin'

// 同步班级名称到企业微信群
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const classId = parseInt(id)
    const { name } = await request.json()

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { wechatGroupId: true, name: true },
    })

    if (!cls) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    if (!cls.wechatGroupId) {
      return NextResponse.json({ error: '班级未关联微信群' }, { status: 400 })
    }

    const newName = name || cls.name

    // 调用企业微信 API 更新群名
    const accessToken = await getAccessToken()
    const url = `${WECOM_API_BASE}/appchat/update?access_token=${accessToken}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatid: cls.wechatGroupId,
        name: newName,
      }),
    })

    const data = await response.json()

    if (data.errcode !== 0) {
      return NextResponse.json({ error: data.errmsg }, { status: 400 })
    }

    // 更新数据库
    await prisma.class.update({
      where: { id: classId },
      data: { name: newName, wechatGroupName: newName },
    })

    return NextResponse.json({ success: true, name: newName })
  } catch (error) {
    console.error('同步群名失败:', error)
    return NextResponse.json({ error: '同步失败' }, { status: 500 })
  }
}
