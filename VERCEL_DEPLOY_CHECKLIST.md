# Vercel 部署检查清单

## 部署前检查

- [x] 代码已推送到 GitHub
- [x] Turso 数据库已创建
- [x] 环境变量已准备好
- [x] vercel.json 配置文件已创建
- [x] package.json 已添加 postinstall 脚本

## 部署步骤

### 1. 登录 Vercel
访问：https://vercel.com/login
使用 GitHub 账号登录

### 2. 导入项目
访问：https://vercel.com/new
或点击 "Add New..." → "Project"

### 3. 导入 GitHub 仓库
- 搜索或选择：`ruiyangruiyi/english-training-system`
- 点击 "Import"

### 4. 配置项目
**Project Name**: english-training-system（或自定义）
**Framework Preset**: Next.js（自动检测）
**Root Directory**: ./（默认）

### 5. 添加环境变量
点击 "Environment Variables"，添加以下变量：

**变量 1:**
- Key: `TURSO_DATABASE_URL`
- Value: `libsql://english-training-ruiyangruiyi.aws-ap-northeast-1.turso.io`
- Environment: Production, Preview, Development（全选）

**变量 2:**
- Key: `TURSO_AUTH_TOKEN`
- Value: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzMwNzM0MzQsImlkIjoiMDE5Y2QzNjgtYTIwMS03Y2Q2LTkyYWYtMGYwMjM4NTUzYmE0IiwicmlkIjoiMmEwZTg1OWQtMWI5Yy00YmVjLThiYWMtZDIzMzUyYThjZGMxIn0.zku419nHvMThdOCnM05pyh6mo47WMz7xso15pKLORdEL9mg4TVX3pRC21Wtv2BPV8RhC-t99CpK5Vrqo5A-uBw`
- Environment: Production, Preview, Development（全选）

### 6. 部署
点击 "Deploy" 按钮

### 7. 等待构建
构建过程约 2-3 分钟，包括：
- 安装依赖
- Prisma generate
- Next.js build
- 部署到边缘网络

### 8. 获取部署 URL
构建成功后，会显示部署 URL，例如：
- `https://english-training-system.vercel.app`
- 或自定义域名

## 部署后检查

### 1. 访问应用
打开部署 URL

### 2. 测试登录
- 用户名：`admin`
- 密码：`admin123`

### 3. 初始化数据库（如果需要）
如果数据库为空，需要运行种子数据：

方式一：通过 Vercel CLI
```bash
vercel env pull .env.production
npx prisma db push
npx prisma db seed
```

方式二：通过 Turso CLI
```bash
turso db shell english-training-ruiyangruiyi < prisma/seed.sql
```

### 4. 验证功能
- [ ] 登录功能正常
- [ ] Dashboard 显示正常
- [ ] 班级管理功能正常
- [ ] 学生管理功能正常
- [ ] 考勤记录功能正常
- [ ] 缴费管理功能正常
- [ ] 作业管理功能正常

## 常见问题

### 构建失败
**问题**: Prisma generate 失败
**解决**: 检查环境变量是否正确配置

### 数据库连接失败
**问题**: Cannot connect to database
**解决**: 
1. 检查 TURSO_DATABASE_URL 格式
2. 检查 TURSO_AUTH_TOKEN 是否有效
3. 确认 Turso 数据库状态正常

### 页面 500 错误
**问题**: 访问页面报 500 错误
**解决**:
1. 查看 Vercel 部署日志
2. 检查 API 路由是否正确
3. 确认数据库 Schema 已推送

## 更新部署

### 自动部署
推送到 GitHub 主分支会自动触发部署：
```bash
git add .
git commit -m "Update"
git push origin master
```

### 手动重新部署
在 Vercel Dashboard 中：
1. 选择项目
2. 点击 "Deployments"
3. 选择最新部署
4. 点击 "Redeploy"

## 监控和日志

### 查看部署日志
Vercel Dashboard → 项目 → Deployments → 选择部署 → View Build Logs

### 查看运行时日志
Vercel Dashboard → 项目 → Logs

### 查看数据库状态
Turso Dashboard → 数据库 → Analytics

## 域名配置（可选）

### 添加自定义域名
1. Vercel Dashboard → 项目 → Settings → Domains
2. 输入域名
3. 按照提示配置 DNS 记录

## 成本
- Vercel Hobby: 免费
- Turso 免费套餐: 9 GB 存储，1亿行读取/月

## 支持
- Vercel 文档: https://vercel.com/docs
- Turso 文档: https://docs.turso.tech
- GitHub 仓库: https://github.com/ruiyangruiyi/english-training-system
