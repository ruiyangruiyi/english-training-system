// ǿ��ʹ�� Node.js ����ʱ
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取企业微信配置
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'wecom_' } }
    })
    const config: Record<string, string> = {
      corpId: '', agentId: '', secret: '', token: '', encodingAESKey: ''
    }
    settings.forEach(s => {
      const key = s.key.replace('wecom_', '')
      if (key in config) config[key] = s.value
    })
    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
  }
}

// 保存企业微信配置
export async function PUT(request: NextRequest) {
  try {
    const { corpId, agentId, secret, token, encodingAESKey } = await request.json()
    
    const configs = [
      { key: 'wecom_corpId', value: corpId || '' },
      { key: 'wecom_agentId', value: agentId || '' },
      { key: 'wecom_secret', value: secret || '' },
      { key: 'wecom_token', value: token || '' },
      { key: 'wecom_encodingAESKey', value: encodingAESKey || '' },
    ]

    for (const cfg of configs) {
      await prisma.systemSetting.upsert({
        where: { key: cfg.key },
        create: cfg,
        update: { value: cfg.value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '保存配置失败' }, { status: 500 })
  }
}
