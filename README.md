# 英语培训班管理系统

## 项目概述

一个用于管理英语培训班的 Web 应用，支持班级管理、学生管理、考勤记录、缴费管理和作业发布。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite + Prisma 5
- **部署**: Vercel

## 项目结构

```
english-training-system/
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   ├── seed.ts            # 种子数据
│   └── migrations/        # 数据库迁移
├── src/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── auth/
│   │   │   ├── classes/
│   │   │   ├── students/
│   │   │   ├── attendances/
│   │   │   ├── payments/
│   │   │   └── homeworks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── prisma.ts      # Prisma Client 单例
├── API.md                 # API 文档
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npx prisma migrate dev
```

这会自动运行种子数据脚本，创建：
- 管理员账号：`admin` / `admin123`
- 2 个示例班级
- 3 个示例学生
- 3 条缴费记录

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 数据库模型

### 7 张表

1. **users** - 用户（管理员）
2. **classes** - 班级
3. **students** - 学生
4. **attendances** - 考勤记录
5. **payments** - 缴费记录
6. **homeworks** - 作业
7. **homework_classes** - 作业与班级关联表

详见 `prisma/schema.prisma`

## API 文档

详见 [API.md](./API.md)

## 开发计划

### 后端 API ✅ (已完成)
- [x] 数据库设计
- [x] Prisma Schema
- [x] 所有 CRUD 接口
- [x] 种子数据
- [x] Build 通过

### 前端页面 (进行中)
- [ ] 登录页
- [ ] 首页 Dashboard
- [ ] 班级管理
- [ ] 学生管理
- [ ] 考勤记录
- [ ] 缴费管理
- [ ] 作业管理

### 测试 & 部署
- [ ] 功能测试
- [ ] Vercel 部署

## 截止时间

**2026-03-10 12:00** - MVP 交付

## 团队

- **后端开发**: 张小发
- **前端开发**: 张小开
- **测试**: 张小测
- **产品**: 张小产
