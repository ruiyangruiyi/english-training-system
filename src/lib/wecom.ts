/**
 * 企业微信API服务
 * 文档：https://developer.work.weixin.qq.com/document/
 */

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

// 缓存access_token
let accessTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * 获取企业微信配置
 */
export function getWecomConfig() {
  return {
    corpId: process.env.WECOM_CORP_ID || '',
    corpSecret: process.env.WECOM_CORP_SECRET || '',
    agentId: process.env.WECOM_AGENT_ID || '',
    token: process.env.WECOM_TOKEN || '',
    encodingAESKey: process.env.WECOM_ENCODING_AES_KEY || '',
  };
}

/**
 * 获取access_token
 */
export async function getAccessToken(): Promise<string> {
  const config = getWecomConfig();
  
  // 检查缓存
  if (accessTokenCache && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  // Mock模式
  if (!config.corpId || !config.corpSecret) {
    console.log('[WeCom] Mock mode: returning fake access_token');
    return 'mock_access_token';
  }

  const url = `${WECOM_API_BASE}/gettoken?corpid=${config.corpId}&corpsecret=${config.corpSecret}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode !== 0) {
    throw new Error(`获取access_token失败: ${data.errmsg}`);
  }

  // 缓存token，提前5分钟过期
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * 创建群聊
 */
export async function createGroupChat(params: {
  name: string;
  owner?: string;
  userlist: string[];
  chatid?: string;
}): Promise<{ chatid: string }> {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.corpId) {
    console.log('[WeCom] Mock mode: createGroupChat', params);
    return { chatid: `mock_chat_${Date.now()}` };
  }

  const token = await getAccessToken();
  const url = `${WECOM_API_BASE}/appchat/create?access_token=${token}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`创建群聊失败: ${data.errmsg}`);
  }
  
  return { chatid: data.chatid };
}

/**
 * 更新群聊信息
 */
export async function updateGroupChat(params: {
  chatid: string;
  name?: string;
  owner?: string;
  add_user_list?: string[];
  del_user_list?: string[];
}): Promise<void> {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.corpId) {
    console.log('[WeCom] Mock mode: updateGroupChat', params);
    return;
  }

  const token = await getAccessToken();
  const url = `${WECOM_API_BASE}/appchat/update?access_token=${token}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`更新群聊失败: ${data.errmsg}`);
  }
}

/**
 * 发送群聊消息
 */
export async function sendGroupMessage(params: {
  chatid: string;
  msgtype: 'text' | 'image' | 'voice' | 'video' | 'file' | 'textcard' | 'news' | 'mpnews' | 'markdown';
  text?: { content: string };
  markdown?: { content: string };
  safe?: number;
}): Promise<void> {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.corpId) {
    console.log('[WeCom] Mock mode: sendGroupMessage', params);
    return;
  }

  const token = await getAccessToken();
  const url = `${WECOM_API_BASE}/appchat/send?access_token=${token}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg}`);
  }
}

/**
 * 获取群聊详情
 */
export async function getGroupChat(chatid: string): Promise<{
  chatid: string;
  name: string;
  owner: string;
  userlist: string[];
}> {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.corpId) {
    console.log('[WeCom] Mock mode: getGroupChat', chatid);
    return {
      chatid,
      name: 'Mock群聊',
      owner: 'mock_owner',
      userlist: ['mock_user1', 'mock_user2'],
    };
  }

  const token = await getAccessToken();
  const url = `${WECOM_API_BASE}/appchat/get?access_token=${token}&chatid=${chatid}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.errcode !== 0) {
    throw new Error(`获取群聊详情失败: ${data.errmsg}`);
  }
  
  return data.chat_info;
}

/**
 * 消息加解密工具（简化版，实际需要使用@wecom/crypto）
 */
export function verifyCallback(params: {
  msg_signature: string;
  timestamp: string;
  nonce: string;
  echostr?: string;
}): { valid: boolean; decrypted?: string } {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.token) {
    console.log('[WeCom] Mock mode: verifyCallback');
    return { valid: true, decrypted: params.echostr };
  }

  // TODO: 实现真实的签名验证
  // 需要使用 sha1(sort([token, timestamp, nonce, echostr]))
  return { valid: true, decrypted: params.echostr };
}

/**
 * 解密消息
 */
export function decryptMessage(encryptedMsg: string): string {
  const config = getWecomConfig();
  
  // Mock模式
  if (!config.encodingAESKey) {
    console.log('[WeCom] Mock mode: decryptMessage');
    return encryptedMsg;
  }

  // TODO: 实现AES解密
  // 需要使用 encodingAESKey 进行解密
  return encryptedMsg;
}
