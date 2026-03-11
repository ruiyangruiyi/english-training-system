/**
 * 企业微信回调代理 - Cloudflare Workers
 * 
 * 功能：接收企业微信回调，验证签名，解密消息，转发到Vercel后端
 * 
 * 部署步骤：
 * 1. 登录 Cloudflare Dashboard
 * 2. 创建 Worker
 * 3. 粘贴此代码
 * 4. 配置环境变量（Settings -> Variables）
 * 5. 部署并获取 URL（如 wecom-callback.xxx.workers.dev）
 * 6. 在企业微信后台配置此 URL 作为回调地址
 */

// 环境变量（在 Cloudflare Dashboard 配置）
// WECOM_TOKEN: twinsun2026
// WECOM_ENCODING_AES_KEY: jeoGjzmabHcSZz9n9GEPBWXzgHK59QKl4ZrKyMi1CnC
// WECOM_CORP_ID: ww85bc4166e6f86115
// BACKEND_URL: https://english-training-system.vercel.app

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        hasToken: !!env.WECOM_TOKEN,
        hasAesKey: !!env.WECOM_ENCODING_AES_KEY,
        hasCorpId: !!env.WECOM_CORP_ID,
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 只处理 /callback 路径
    if (url.pathname !== '/callback' && url.pathname !== '/') {
      return new Response('Not Found', { status: 404 });
    }

    const msg_signature = url.searchParams.get('msg_signature') || '';
    const timestamp = url.searchParams.get('timestamp') || '';
    const nonce = url.searchParams.get('nonce') || '';
    const echostr = url.searchParams.get('echostr') || '';

    // GET 请求 - URL验证
    if (request.method === 'GET' && echostr) {
      console.log('GET验证请求:', { msg_signature, timestamp, nonce });
      
      // 验证签名
      const signature = await sha1([env.WECOM_TOKEN, timestamp, nonce, echostr].sort().join(''));
      console.log('计算签名:', signature, '期望:', msg_signature);
      
      if (signature !== msg_signature) {
        return new Response(JSON.stringify({
          error: '签名验证失败',
          calculated: signature,
          expected: msg_signature,
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      // 解密 echostr
      try {
        const decrypted = await decryptMessage(echostr, env.WECOM_ENCODING_AES_KEY, env.WECOM_CORP_ID);
        console.log('解密成功:', decrypted);
        return new Response(decrypted, {
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (error) {
        console.error('解密失败:', error);
        return new Response(JSON.stringify({
          error: '解密失败',
          message: error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // POST 请求 - 接收消息，转发到后端
    if (request.method === 'POST') {
      const body = await request.text();
      console.log('POST消息:', body.slice(0, 200));

      // 提取加密消息
      const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
      if (!encryptMatch) {
        return new Response('success');
      }

      const encrypt = encryptMatch[1];

      // 验证签名
      const signature = await sha1([env.WECOM_TOKEN, timestamp, nonce, encrypt].sort().join(''));
      if (signature !== msg_signature) {
        return new Response('签名验证失败', { status: 403 });
      }

      // 解密消息
      try {
        const decrypted = await decryptMessage(encrypt, env.WECOM_ENCODING_AES_KEY, env.WECOM_CORP_ID);
        console.log('解密消息:', decrypted.slice(0, 200));

        // 转发到 Vercel 后端处理业务逻辑
        if (env.BACKEND_URL) {
          fetch(`${env.BACKEND_URL}/api/wecom/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: decrypted,
          }).catch(err => console.error('转发失败:', err));
        }

        return new Response('success');
      } catch (error) {
        console.error('解密失败:', error);
        return new Response('success'); // 企业微信要求返回success
      }
    }

    // 无参数GET请求 - 返回状态
    return new Response(JSON.stringify({
      status: 'ready',
      message: '企业微信回调代理已就绪',
      usage: '在企业微信后台配置此URL作为回调地址',
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// SHA1 哈希
async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// AES解密
async function decryptMessage(encrypt, encodingAESKey, corpId) {
  // Base64解码 AESKey
  const aesKey = base64ToArrayBuffer(encodingAESKey + '=');
  
  // Base64解码密文
  const encryptedData = base64ToArrayBuffer(encrypt);
  
  // IV = AESKey前16字节
  const iv = aesKey.slice(0, 16);
  
  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    aesKey,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
  
  // 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: iv },
    key,
    encryptedData
  );
  
  const decryptedArray = new Uint8Array(decrypted);
  
  // 去除PKCS7填充
  const pad = decryptedArray[decryptedArray.length - 1];
  const unpaddedArray = decryptedArray.slice(0, decryptedArray.length - pad);
  
  // 解析内容：random(16) + msg_len(4) + msg + receiveid
  const msgLen = (unpaddedArray[16] << 24) | (unpaddedArray[17] << 16) | (unpaddedArray[18] << 8) | unpaddedArray[19];
  const msg = new TextDecoder().decode(unpaddedArray.slice(20, 20 + msgLen));
  const receiveid = new TextDecoder().decode(unpaddedArray.slice(20 + msgLen));
  
  // 验证 CorpID
  if (receiveid !== corpId) {
    console.warn('CorpID不匹配:', receiveid, '期望:', corpId);
  }
  
  return msg;
}

// Base64 转 ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
