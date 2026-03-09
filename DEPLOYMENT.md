# 部署指南 - Vercel

## 部署步骤

### 1. 准备代码
确保项目包含以下文件：
- `package.json` - 包含所有依赖
- `prisma/` - 数据库 schema 和迁移
- `src/app/` - Next.js 应用代码
- `.env.example` - 环境变量示例

### 2. 推送到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Vercel 部署
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: . (根目录)
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

### 4. 环境变量配置
在 Vercel 项目设置 > Environment Variables 添加：
```
DATABASE_URL=file:./data.db
```
或者使用 Vercel Postgres（推荐生产环境）

### 5. 构建配置
在 `vercel.json` 或项目设置中添加：
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### 6. 数据库配置（SQLite on Vercel）
SQLite 在 Vercel 上需要特殊处理：

**选项 A：使用 Vercel Postgres（推荐）**
1. 在 Vercel 控制台创建 Postgres 数据库
2. 更新 `prisma/schema.prisma` 数据源：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_URL")
   }
   ```
3. 在环境变量中添加 `POSTGRES_URL`
4. 在 `package.json` 的 build 脚本前添加：
   ```json
   "scripts": {
     "vercel-build": "prisma generate && prisma migrate deploy && next build"
   }
   ```

**选项 B：使用 SQLite（开发/演示）**
SQLite 在 Vercel 无服务器环境中有写入限制。可以：
1. 使用只读模式
2. 或使用云存储（如 S3）存储数据库文件

### 7. 部署脚本
在 `package.json` 中添加：
```json
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy && next build",
  "build": "next build",
  "start": "next start",
  "dev": "next dev"
}
```

## 测试部署

### 本地构建测试
```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma migrate dev

# 3. 构建
npm run build

# 4. 启动生产服务器
npm start
```

### 访问地址
- 本地开发：http://localhost:3000
- Vercel 部署：https://your-project.vercel.app

### 测试账号
- 用户名: `admin`
- 密码: `admin123`

## 故障排除

### 常见问题

1. **构建失败：数据库连接错误**
   - 确保环境变量 `DATABASE_URL` 正确设置
   - 检查 Prisma schema 是否正确

2. **运行时错误：API 404**
   - 检查 `src/app/api` 路由是否正确
   - 确保没有 TypeScript 错误

3. **数据库写入失败（SQLite on Vercel）**
   - 考虑切换到 Vercel Postgres
   - 或使用只读模式演示

4. **静态资源加载失败**
   - 检查 `next.config.js` 配置
   - 确保图片资源路径正确

### 监控和日志
- Vercel 控制台查看部署日志
- 使用 Vercel Analytics 监控性能
- 检查 Function Logs for API 错误

## 维护

### 数据库迁移
```bash
# 开发环境
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy
```

### 数据备份
```bash
# 导出 SQLite 数据
sqlite3 data.db .dump > backup.sql

# 导入数据
sqlite3 data.db < backup.sql
```

### 更新依赖
```bash
npm update
npx prisma generate
npm run build
```

## 支持
- 开发团队：TWINSUN（张小欧、张小产、张小开、张小发、张小测）
- 项目文档：https://github.com/your-org/english-training-system
- 问题反馈：GitHub Issues
