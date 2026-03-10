import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken, getWecomConfig } from '@/lib/wecom';

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

// GET /api/classes/[id]/wechat-qrcode - 获取班级群二维码
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classId = parseInt(id);

    const cls = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!cls) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 });
    }

    if (!cls.wechatGroupId) {
      return NextResponse.json({ error: '班级未关联微信群' }, { status: 400 });
    }

    const config = getWecomConfig();

    // Mock模式
    if (!config.corpId) {
      return NextResponse.json({
        classId: cls.id,
        className: cls.name,
        wechatGroupId: cls.wechatGroupId,
        qrcodeUrl: `https://example.com/qrcode/${cls.wechatGroupId}`,
        mock: true,
      });
    }

    // 真实模式：获取群二维码
    const token = await getAccessToken();
    const url = `${WECOM_API_BASE}/externalcontact/groupchat/get_join_way?access_token=${token}`;
    
    // 先查询是否已有入群方式
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cls.wechatGroupId }),
    });
    
    const data = await res.json();

    return NextResponse.json({
      classId: cls.id,
      className: cls.name,
      wechatGroupId: cls.wechatGroupId,
      qrcodeUrl: data.join_way?.qr_code || null,
      configId: data.join_way?.config_id || null,
    });
  } catch (error) {
    console.error('获取群二维码失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
