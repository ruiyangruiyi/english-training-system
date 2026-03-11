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
  // echostr 可能被 URL 编码，需要解码
  const echostrRaw = searchParams.get('echostr') || ''
  const echostr = decodeURIComponent(echostrRaw)

  // 无参数时返回状态信息（用于手动检查）
  if (!msg_signature && !echostr) {
    return new NextResponse(JSON.stringify({
      status: 'ready',
      message: '企业微信回调接口已就绪',
      config: {
        hasToken: !!WECOM_TOKEN,
        hasAesKey: !!WECOM_ENCODING_AES_KEY,
        hasCorpId: !!WECOM_CORP_ID,
        tokenLen: WECOM_TOKEN.length,
        aesKeyLen: WECOM_ENCODING_AES_KEY.length,
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log('[WeCom Callback] GET验证请求')
  console.log('[WeCom Callback] msg_signature:', msg_signature)
  console.log('[WeCom Callback] timestamp:', timestamp)
  console.log('[WeCom Callback] nonce:', nonce)
  console.log('[WeCom Callback] echostr长度:', echostr.length)

  // 验证签名 - 使用 token, timestamp, nonce, echostr 四个参数
  const signature = generateSignature(WECOM_TOKEN, timestamp, nonce, echostr)
  
  console.log('[WeCom Callback] 计算签名:', signature)
  console.log('[WeCom Callback] 期望签名:', msg_signature)

  if (signature !== msg_signature) {
    console.error('[WeCom Callback] 签名验证失败')
    return new NextResponse('签名验证失败', { status: 403 })
  }

  // 尝试解密echostr，如果失败则直接返回明文
  try {
    // 先尝试Base64解码，判断是否是加密数据
    const testBuffer = Buffer.from(echostr, 'base64')
    if (testBuffer.length > 0 && testBuffer.length % 16 === 0) {
      // 可能是加密数据，尝试解密
      const decrypted = decryptEchoStr(echostr)
      console.log('[WeCom Callback] 解密成功，返回:', decrypted)
      return new NextResponse(decrypted, {
        headers: { 'Content-Type': 'text/plain' }
      })
    } else {
      // 明文模式，直接返回
      console.log('[WeCom Callback] 明文模式，直接返回:', echostr)
      return new NextResponse(echostr, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  } catch (error) {
    // 解密失败，尝试直接返回明文
    console.log('[WeCom Callback] 解密失败，尝试明文模式:', error)
    return new NextResponse(echostr, {
      headers: { 'Content-Type': 'text/plain' }
    })
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

// 解密echostr（URL验证用）
function decryptEchoStr(echostr: string): string {
  if (!WECOM_ENCODING_AES_KEY) {
    throw new Error('WECOM_ENCODING_AES_KEY未配置')
  }

  // AESKey = Base64_Decode(EncodingAESKey + "=")，长度应为32字节
  const aesKey = Buffer.from(WECOM_ENCODING_AES_KEY + '=', 'base64')
  if (aesKey.length !== 32) {
    throw new Error(`AESKey长度错误: ${aesKey.length}，应为32`)
  }
  
  // IV = AESKey前16字节
  const iv = aesKey.slice(0, 16)

  // Base64解码密文
  const encryptedBuffer = Buffer.from(echostr, 'base64')

  // AES-256-CBC解密
  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv)
  decipher.setAutoPadding(false)

  let decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

  // 去除PKCS7填充
  const pad = decrypted[decrypted.length - 1]
  if (pad < 1 || pad > 32) {
    throw new Error(`无效的PKCS7填充: ${pad}`)
  }
  decrypted = decrypted.slice(0, decrypted.length - pad)

  // 解析内容格式：random(16字节) + msg_len(4字节,网络字节序) + msg + receiveid
  if (decrypted.length < 20) {
    throw new Error(`解密后数据太短: ${decrypted.length}`)
  }
  
  const msgLen = decrypted.readUInt32BE(16)
  if (20 + msgLen > decrypted.length) {
    throw new Error(`消息长度错误: msgLen=${msgLen}, total=${decrypted.length}`)
  }
  
  const msg = decrypted.slice(20, 20 + msgLen).toString('utf8')
  const receiveid = decrypted.slice(20 + msgLen).toString('utf8')

  console.log('[WeCom Callback] receiveid:', receiveid, '期望:', WECOM_CORP_ID)

  return msg
}

// 解密消息（POST消息用）
function decryptMessage(encrypt: string): string {
  return decryptEchoStr(encrypt)
}
