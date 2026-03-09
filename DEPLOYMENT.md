# 部署指南

## 快速部署到 Vercel

### 前置准备

1. **Turso 数据库**
   - 访问 https://turso.tech/ 注册账号
   - 创建数据库并获取 URL 和 Auth Token
   - 详见 [TURSO_SETUP.md](./TURSO_SETUP.md)

2. **企业微信应用**
   - 注册企业微信
   - 创建自建应用
   - 获取 Corp ID、Agent ID、Secret 等配置

### 部署步骤

#### 方式一：通过 Vercel Dashboard（推荐）

1. **导入项目**
   - 访问 https://vercel.com/new
   - 选择 GitHub 仓库
   - 点击 Import

2. **配置环境变量**
   在 Environment Variables 中添加：
   ```
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your_auth_token
   WECOM_CORP_ID=your_corp_id
   WECOM_AGENT_ID=your_agent_id
   WECOM_SECRET=your_secret
   WECOM_TOKEN=your_token
   WECOM_ENCODING_AES_KEY=your_encoding_aes_key
   ```

3. **部署**
   - 点击 Deploy
   - 等待构建完成

#### 方式二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel --prod
   ```

4. **添加环境变量**
   ```bash
   vercel env add TURSO_DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   vercel env add WECOM_CORP_ID
   vercel env add WECOM_AGENT_ID
   vercel env add WECOM_SECRET
   vercel env add WECOM_TOKEN
   vercel env add WECOM_ENCODING_AES_KEY
   ```

### 初始化数据库

部署完成后，需要初始化数据库：

1. **推送 Schema**
   ```bash
   # 设置环境变量
   export TURSO_DATABASE_URL="libsql://your-database.turso.io"
   export TURSO_AUTH_TOKEN="your_auth_token"
   
   # 推送 Schema
   npx prisma db push
   ```

2. **运行种子数据**
   ```bash
   npx prisma db seed
   ```

### 配置企业微信回调

1. **获取部署 URL**
   - 例如：`https://your-app.vercel.app`

2. **配置回调 URL**
   - 进入企业微信管理后台
   - 应用管理 → 自建应用 → 接收消息
   - 设置 URL：`https://your-app.vercel.app/api/wecom/callback`
   - 设置 Token 和 EncodingAESKey

3. **验证回调**
   - 保存配置后，企业微信会发送验证请求
   - 确保回调接口正常响应

### 验证部署

1. **访问应用**
   ```
   https://your-app.vercel.app
   ```

2. **登录测试**
   - 用户名：`admin`
   - 密码：`admin123`

3. **测试企业微信**
   - 在企业微信中向应用发送消息
   - 发送"建群"测试对话式建群功能

## 常见问题

### 构建失败

**问题**：Prisma generate 失败
**解决**：
```bash
# 清除缓存
rm -rf node_modules/.prisma
npm install
```

### 数据库连接失败

**问题**：Cannot connect to database
**解决**：
1. 检查 TURSO_DATABASE_URL 格式（必须以 `libsql://` 开头）
2. 检查 TURSO_AUTH_TOKEN 是否正确
3. 确认 Turso 数据库状态正常

### 企业微信回调失败

**问题**：回调验证失败
**解决**：
1. 检查回调 URL 是否正确
2. 检查 Token 和 EncodingAESKey 配置
3. 查看 Vercel 日志排查错误

### 环境变量未生效

**问题**：部署后环境变量为空
**解决**：
1. 确认在 Vercel Dashboard 中正确添加了环境变量
2. 重新部署项目
3. 检查变量名是否拼写正确

## 性能优化

### 启用边缘缓存

在 `next.config.js` 中配置：

```javascript
module.exports = {
  experimental: {
    serverActions: true,
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=120' },
      ],
    },
  ],
}
```

### 数据库连接池

Turso 自动管理连接池，无需额外配置。

### CDN 加速

Vercel 自动使用全球 CDN，静态资源会自动缓存。

## 监控和日志

### Vercel 日志

访问 Vercel Dashboard → 项目 → Logs 查看运行日志

### Turso 监控

访问 Turso Dashboard → 数据库 → Analytics 查看数据库性能

### 错误追踪

建议集成 Sentry：

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 更新部署

### 自动部署

推送到 GitHub 主分支会自动触发部署：

```bash
git add .
git commit -m "Update"
git push origin main
```

### 手动部署

```bash
vercel --prod
```

### 回滚

在 Vercel Dashboard 中选择之前的部署版本，点击 Promote to Production

## 成本估算

### Vercel
- Hobby 计划：免费
- Pro 计划：$20/月（团队使用）

### Turso
- 免费套餐：500 个数据库，9 GB 存储
- 按量付费：超出后 $0.25/GB

### 总计
小型项目（<1000 用户）：**免费**
中型项目（1000-10000 用户）：**$20-50/月**

## 安全建议

1. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

2. **启用 HTTPS**
   Vercel 自动提供 SSL 证书

3. **限制 API 访问**
   添加 rate limiting 中间件

4. **备份数据库**
   定期导出 Turso 数据库：
   ```bash
   turso db shell english-training-system .dump > backup-$(date +%Y%m%d).sql
   ```

5. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Vercel 环境变量管理
   - 定期轮换 Token

## 支持

遇到问题？
- Vercel 文档：https://vercel.com/docs
- Turso 文档：https://docs.turso.tech
- Next.js 文档：https://nextjs.org/docs
- Prisma 文档：https://www.prisma.io/docs
