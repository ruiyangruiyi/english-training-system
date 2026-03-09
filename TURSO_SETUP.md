# Turso 数据库设置指南

## 1. 创建 Turso 账号和数据库

### 注册 Turso
访问 https://turso.tech/ 注册账号

### 安装 Turso CLI（可选）
```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex
```

### 或使用 Turso Web Dashboard
直接在 https://turso.tech/app 创建数据库

## 2. 创建数据库

### 使用 CLI
```bash
# 登录
turso auth login

# 创建数据库
turso db create english-training-system

# 获取数据库 URL
turso db show english-training-system --url

# 创建 Auth Token
turso db tokens create english-training-system
```

### 使用 Web Dashboard
1. 登录 Turso Dashboard
2. 点击 "Create Database"
3. 输入数据库名称：`english-training-system`
4. 选择地区（建议选择离用户最近的）
5. 创建完成后，复制 Database URL 和 Auth Token

## 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# Turso 数据库
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_auth_token_here

# 企业微信配置
WECOM_CORP_ID=your_corp_id
WECOM_AGENT_ID=your_agent_id
WECOM_SECRET=your_secret
WECOM_TOKEN=your_token
WECOM_ENCODING_AES_KEY=your_encoding_aes_key
```

## 4. 初始化数据库

### 方式一：使用 Prisma Migrate（推荐）
```bash
# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到数据库
npx prisma db push
```

### 方式二：使用 Turso CLI
```bash
# 导出本地 SQLite 数据库
sqlite3 prisma/dev.db .dump > schema.sql

# 导入到 Turso
turso db shell english-training-system < schema.sql
```

## 5. 运行种子数据（可选）

```bash
npx prisma db seed
```

## 6. 验证连接

创建测试脚本 `test-turso.js`：

```javascript
const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users:', users)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

运行测试：
```bash
node test-turso.js
```

## 7. Vercel 部署配置

在 Vercel 项目设置中添加环境变量：

1. 进入 Vercel Dashboard
2. 选择项目
3. Settings → Environment Variables
4. 添加以下变量：
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `WECOM_CORP_ID`
   - `WECOM_AGENT_ID`
   - `WECOM_SECRET`
   - `WECOM_TOKEN`
   - `WECOM_ENCODING_AES_KEY`

## 8. 部署

```bash
# 使用 Vercel CLI
vercel --prod

# 或推送到 GitHub，自动部署
git push origin main
```

## 常见问题

### Q: 如何查看数据库内容？
A: 使用 Turso CLI：
```bash
turso db shell english-training-system
```

### Q: 如何备份数据库？
A: 
```bash
turso db shell english-training-system .dump > backup.sql
```

### Q: 如何重置数据库？
A:
```bash
# 删除所有表
turso db shell english-training-system "DROP TABLE IF EXISTS User; DROP TABLE IF EXISTS Class; ..."

# 重新推送 Schema
npx prisma db push --force-reset
```

### Q: 连接失败怎么办？
A: 检查：
1. TURSO_DATABASE_URL 格式是否正确（必须以 `libsql://` 开头）
2. TURSO_AUTH_TOKEN 是否有效
3. 网络连接是否正常
4. Turso 服务状态：https://status.turso.tech/

## 性能优化

### 启用边缘缓存
Turso 支持边缘复制，可以在多个地区部署副本：

```bash
turso db replicate english-training-system add <region>
```

### 连接池配置
在 `prisma.ts` 中配置连接池：

```typescript
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
  syncUrl: process.env.TURSO_SYNC_URL, // 可选：本地同步
  syncInterval: 60, // 同步间隔（秒）
})
```

## 监控和日志

### 查看数据库统计
```bash
turso db inspect english-training-system
```

### 查看查询日志
在 Turso Dashboard 中查看 Analytics 面板

## 成本

Turso 免费套餐包括：
- 500 个数据库
- 9 GB 存储
- 1 亿行读取/月
- 400 万行写入/月

超出后按量付费，详见：https://turso.tech/pricing
