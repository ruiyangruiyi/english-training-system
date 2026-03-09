// 企业微信配置
export const WECOM_CONFIG = {
  corpId: process.env.WECOM_CORP_ID || '',
  agentId: process.env.WECOM_AGENT_ID || '',
  secret: process.env.WECOM_SECRET || '',
  token: process.env.WECOM_TOKEN || '',
  encodingAESKey: process.env.WECOM_ENCODING_AES_KEY || '',
}

// 企业微信 API 基础URL
export const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin'

// Access Token 缓存（简单实现，生产环境应使用 Redis）
let accessTokenCache: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  // 检查缓存
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token
  }

  // 获取新 token
  const url = `${WECOM_API_BASE}/gettoken?corpid=${WECOM_CONFIG.corpId}&corpsecret=${WECOM_CONFIG.secret}`
  const response = await fetch(url)
  const data = await response.json()

  if (data.errcode !== 0) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`)
  }

  // 缓存 token（提前5分钟过期）
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}
