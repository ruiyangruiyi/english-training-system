# Cloudflare Workers 部署指南

## 企业微信回调代理

由于企业微信回调验证需要国内可访问的服务器，使用 Cloudflare Workers 作为代理层���

## 部署步骤

### 1. 登录 Cloudflare

访问 https://dash.cloudflare.com 并登录（没有账号需要注册）

### 2. 创建 Worker

1. 点击左侧菜单 "Workers & Pages"
2. 点击 "Create application"
3. 选择 "Create Worker"
4. 输入名称：`wecom-callback`
5. 点击 "Deploy"

### 3. 编辑代码

1. 点击 "Edit code"
2. 删除默认代码
3. 粘贴 `workers/wecom-callback.js` 的内容
4. 点击 "Save and Deploy"

### 4. 配置环境变量

1. 回到 Worker 页面
2. 点击 "Settings" -> "Variables"
3. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| WECOM_TOKEN | twinsun2026 |
| WECOM_ENCODING_AES_KEY | jeoGjzmabHcSZz9n9GEPBWXzgHK59QKl4ZrKyMi1CnC |
| WECOM_CORP_ID | ww85bc4166e6f86115 |
| BACKEND_URL | https://english-training-system.vercel.app |

4. 点击 "Save and Deploy"

### 5. 获取 Worker URL

部署后会得到一个 URL，格式如：
```
https://wecom-callback.你的用户名.workers.dev
```

### 6. 配置企业微信

1. 登录企业微信管理后台
2. 进入应用管理 -> 选择应用
3. 设置 "接收消息" 的 URL 为 Worker URL：
   ```
   https://wecom-callback.xxx.workers.dev/callback
   ```
4. Token 和 EncodingAESKey 保持不变
5. 点击保存，验证应该通过

## 验证

访问 Worker URL 检查状态：
```
https://wecom-callback.xxx.workers.dev/health
```

应该返回：
```json
{
  "status": "ok",
  "hasToken": true,
  "hasAesKey": true,
  "hasCorpId": true
}
```

## 工作原理

```
企业微信 -> CF Workers (验证+解密) -> Vercel 后端 (业务处理)
```

1. 企业微信发送回调请求到 CF Workers
2. CF Workers 验证签名、解密消息
3. 解密后的消息转发到 Vercel 后端处理业务逻辑
4. 返回响应给企业微信

## 优势

- ✅ Cloudflare 在国内有节点，访问快
- ✅ 免费额度足够（每天 10 万次请求）
- ✅ 无需备案
- ✅ 部署简单，几分钟完成
