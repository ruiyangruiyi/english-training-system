import { NextRequest, NextResponse } from 'next/server';

// 企业微信回调验证和消息接收
// 文档：https://developer.work.weixin.qq.com/document/path/90930

// GET /api/wecom/callback - 验证URL有效性
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const msg_signature = searchParams.get('msg_signature');
    const timestamp = searchParams.get('timestamp');
    const nonce = searchParams.get('nonce');
    const echostr = searchParams.get('echostr');

    if (!msg_signature || !timestamp || !nonce || !echostr) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // TODO: 实现企业微信消息签名验证
    // 需要配置 Token 和 EncodingAESKey
    // 验证通过后返回解密后的 echostr

    // 暂时直接返回（开发测试用）
    console.log('企业微信回调验证:', { msg_signature, timestamp, nonce });
    
    return new NextResponse(echostr, {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('回调验证失败:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}

// POST /api/wecom/callback - 接收消息
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const msg_signature = searchParams.get('msg_signature');
    const timestamp = searchParams.get('timestamp');
    const nonce = searchParams.get('nonce');

    // 获取请求体（XML格式）
    const body = await request.text();
    
    console.log('收到企业微信消息:', { msg_signature, timestamp, nonce, body });

    // TODO: 实现消息解密和处理
    // 1. 验证签名
    // 2. 解密消息
    // 3. 解析XML
    // 4. 调用 /api/wecom/chat 处理消息
    // 5. 返回响应

    // 暂时返回空响应（表示成功接收）
    return new NextResponse('success', {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('处理消息失败:', error);
    return new NextResponse('error', { status: 500 });
  }
}
