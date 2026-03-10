# 教学管理系统 v1.0.0

一站式英语培训班管理解决方案，支持班级、学生、考勤、缴费、作业全流程管理，并集成企业微信客户群功能。

## ✨ 功能特性

### 核心功能
- 📚 **班级管理** - 创建、编辑、删除班级，支持多老师分配
- 👨‍🎓 **学生管理** - 学生信息录入、班级分配、状态管理
- ✅ **考勤管理** - 按日期记录考勤，支持出勤/请假/缺勤状态和备注
- 💰 **缴费管理** - 学费记录、缴费状态跟踪
- 📝 **作业管理** - 作业发布、班级分配、截止日期设置
- 📊 **数据统计** - Dashboard 展示关键指标

### 企业微信集成（二期）
- 🤖 **对话式建群** - 通过私聊快速创建班级群
- 🔄 **名称双向同步** - 班级名与群名自动同步
- 📢 **作业提醒** - 定时推送作业到家长群
- 📈 **完成统计** - 自动统计作业完成情况
- 🗂️ **群聊分析** - AI 生成每日群聊摘要

### 多角色支持
- 👑 **管理员** - 全局管理权限
- 👨‍🏫 **老师** - 管理自己负责的班级

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | SQLite / Turso (LibSQL) |
| ORM | Prisma 5 |
| 部署 | Vercel |
| 集成 | 企业微信 API |

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/ruiyangruiyi/english-training-system.git
cd english-training-system

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填写配置

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 初始化测试数据
npx tsx prisma/seed.ts

# 6. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 老师1 | teacher1 | teacher123 |
| 老师2 | teacher2 | teacher123 |

## 📦 部署到 Vercel

### 1. 创建 Turso 数据库

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录
turso auth login

# 创建数据库
turso db create english-training

# 获取连接信息
turso db show english-training --url
turso db tokens create english-training
```

### 2. 部署到 Vercel

1. Fork 本仓库到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   - `TURSO_DATABASE_URL` - Turso 数据库 URL
   - `TURSO_AUTH_TOKEN` - Turso 认证 Token
4. 点击 Deploy

### 3. 初始化生产数据库

```bash
# 设置环境变量后执行
npx tsx scripts/migrate-turso.ts
npx tsx scripts/seed-turso.ts
```

## 📖 API 文档

详见 [API.md](./API.md)

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| GET | /api/classes | 获取班级列表 |
| GET | /api/students | 获取学生列表 |
| GET/POST | /api/attendances | 考勤管理 |
| GET/POST | /api/payments | 缴费管理 |
| GET/POST | /api/homeworks | 作业管理 |

## 📁 项目结构

```
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── seed.ts            # 种子数据
├── scripts/
│   ├── migrate-turso.ts   # Turso 迁移脚本
│   └── seed-turso.ts      # Turso 种子数据
├── src/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── attendances/   # 考勤页面
│   │   ├── classes/       # 班级页面
│   │   ├── homeworks/     # 作业页面
│   │   ├── payments/      # 缴费页面
│   │   ├── students/      # 学生页面
│   │   └── login/         # 登录页面
│   ├── components/        # 公共组件
│   └── lib/
│       ├── prisma.ts      # Prisma 客户端
│       └── wecom.ts       # 企业微信 SDK
└── vercel.json            # Vercel 配置
```

## 🔧 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| TURSO_DATABASE_URL | ✅ | Turso 数据库 URL |
| TURSO_AUTH_TOKEN | ✅ | Turso 认证 Token |
| WECOM_CORP_ID | ❌ | 企业微信企业ID |
| WECOM_AGENT_ID | ❌ | 企业微信应用ID |
| WECOM_SECRET | ❌ | 企业微信应用Secret |
| OPENAI_API_KEY | ❌ | OpenAI API Key（群聊分析用）|

## 📄 License

MIT License

## 👥 团队

TWINSUN 团队出品

- 产品经理：张小产
- 开发工程师：张小开、张小发
- 测试工程师：张小测
- CEO：张小欧
