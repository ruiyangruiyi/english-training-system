import { NextRequest, NextResponse } from 'next/server'
import { createHash, createDecipheriv } from 'crypto'

// 强制使用 Node.js 运行时
export const runtime = 'nodejs'

const WECOM_TOKEN = process.env.WECOM_TOKEN || ''
const WECOM_ENCODING_AES_KEY = process.env.WECOM_ENCODING_AES_KEY || ''
const WECOM_CORP_ID = process.env.WECOM_CORP_ID || ''

// GET 请求 - URL验证
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const msg_signature = searchParams.get('msg_signature') || ''
  const timestamp = searchParams.get('timestamp') || ''
  const nonce = searchParams.get('nonce') || ''
  const echostr = searchParams.get('echostr') || ''

  // 无参数时返回状态信息（用于手动检查）
  if (!msg_signature && !echostr) {
    return new NextResponse(JSON.stringify({
      status: 'ready',
      message: '企业微信回调接口已就绪',
      config: {
        hasToken: !!WECOM_TOKEN,
        hasAesKey: !!WECOM_ENCODING_AES_KEY,
        hasCorpId: !!WECOM_CORP_ID,
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log('[WeCom Callback] GET验证请求:', { msg_signature, timestamp, nonce, echostr: echostr.slice(0, 20) + '...' })
  console.log('[WeCom Callback] Token配置:', WECOM_TOKEN ? '已配置' : '未配置')

  // 验证签名
  const signature = generateSignature(WECOM_TOKEN, timestamp, nonce, echostr)
  console.log('[WeCom Callback] 计算签名:', signature, '期望签名:', msg_signature)

  if (signature !== msg_signature) {
    console.error('[WeCom Callback] 签名验证失败')
    return new NextResponse('签名验证失败', { status: 403 })
  }

  // 解密echostr
  try {
    const decrypted = decryptMessage(echostr)
    console.log('[WeCom Callback] 解密成功，返回:', decrypted)
    return new NextResponse(decrypted, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error('[WeCom Callback] 解密失败:', error)
    return new NextResponse('解密失败', { status: 500 })
  }
}

// POST 请求 - 接收消息
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const msg_signature = searchParams.get('msg_signature') || ''
  const timestamp = searchParams.get('timestamp') || ''
  const nonce = searchParams.get('nonce') || ''

  try {
    const body = await request.text()
    console.log('[WeCom Callback] POST消息:', body.slice(0, 200))

    // 解析XML获取加密消息
    const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/)
    if (!encryptMatch) {
      console.log('[WeCom Callback] 非加密消息，直接处理')
      return NextResponse.json({ errcode: 0, errmsg: 'ok' })
    }

    const encrypt = encryptMatch[1]

    // 验证签名
    const signature = generateSignature(WECOM_TOKEN, timestamp, nonce, encrypt)
    if (signature !== msg_signature) {
      console.error('[WeCom Callback] POST签名验证失败')
      return NextResponse.json({ errcode: -1, errmsg: '签名验证失败' }, { status: 403 })
    }

    // 解密消息
    const decrypted = decryptMessage(encrypt)
    console.log('[WeCom Callback] 解密消息:', decrypted.slice(0, 200))

    // TODO: 处理解密后的消息
    // 这里可以解析XML并处理具体业务逻辑

    return NextResponse.json({ errcode: 0, errmsg: 'ok' })
  } catch (error) {
    console.error('[WeCom Callback] POST处理失败:', error)
    return NextResponse.json({ errcode: -1, errmsg: '处理失败' }, { status: 500 })
  }
}

// 生成签名
function generateSignature(token: string, timestamp: string, nonce: string, encrypt: string): string {
  const arr = [token, timestamp, nonce, encrypt].sort()
  const str = arr.join('')
  return createHash('sha1').update(str).digest('hex')
}

// 解密消息
function decryptMessage(encrypt: string): string {
  if (!WECOM_ENCODING_AES_KEY) {
    throw new Error('WECOM_ENCODING_AES_KEY未配置')
  }

  // AESKey = Base64_Decode(EncodingAESKey + "=")
  const aesKey = Buffer.from(WECOM_ENCODING_AES_KEY + '=', 'base64')
  
  // IV = AESKey前16字节
  const iv = aesKey.slice(0, 16)

  // 解密
  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv)
  decipher.setAutoPadding(false)

  const encryptedBuffer = Buffer.from(encrypt, 'base64')
  let decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

  // 去除PKCS7填充
  const pad = decrypted[decrypted.length - 1]
  decrypted = decrypted.slice(0, decrypted.length - pad)

  // 解析内容：random(16) + msg_len(4) + msg + receiveid
  const msgLen = decrypted.readUInt32BE(16)
  const msg = decrypted.slice(20, 20 + msgLen).toString('utf8')
  const receiveid = decrypted.slice(20 + msgLen).toString('utf8')

  // 验证receiveid
  if (receiveid !== WECOM_CORP_ID) {
    console.warn('[WeCom Callback] CorpID不匹配:', receiveid, '期望:', WECOM_CORP_ID)
  }

  return msg
}
