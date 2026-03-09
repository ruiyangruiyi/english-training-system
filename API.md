# API 文档 - 英语培训班管理系统

## 基础信息

- Base URL: `http://localhost:3000`
- 所有请求和响应都是 JSON 格式
- 错误响应格式：`{ "error": "错误信息" }`

## 认证

### 登录
```
POST /api/auth/login
```

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应：**
```json
{
  "id": 1,
  "username": "admin",
  "name": "管理员"
}
```

---

## 班级管理

### 获取班级列表
```
GET /api/classes
```

**响应：**
```json
[
  {
    "id": 1,
    "name": "初级英语班",
    "grade": "一年级",
    "schedule": "周六 9:00-11:00",
    "_count": { "students": 2 }
  }
]
```

### 创建班级
```
POST /api/classes
```

**请求体：**
```json
{
  "name": "高级英语班",
  "grade": "五年级",
  "schedule": "周日 14:00-16:00"
}
```

### 获取班级详情
```
GET /api/classes/:id
```

**响应：**
```json
{
  "id": 1,
  "name": "初级英语班",
  "grade": "一年级",
  "schedule": "周六 9:00-11:00",
  "students": [...]
}
```

### 更新班级
```
PUT /api/classes/:id
```

**请求体：**
```json
{
  "name": "初级英语班A",
  "grade": "一年级",
  "schedule": "周六 10:00-12:00"
}
```

### 删除班级
```
DELETE /api/classes/:id
```

---

## 学生管理

### 获取学生列表
```
GET /api/students
GET /api/students?classId=1  // 按班级筛选
```

**响应：**
```json
[
  {
    "id": 1,
    "name": "张三",
    "grade": "一年级",
    "parentPhone": "13800138001",
    "classId": 1,
    "class": { "id": 1, "name": "初级英语班", ... }
  }
]
```

### 创建学生
```
POST /api/students
```

**请求体：**
```json
{
  "name": "赵六",
  "grade": "二年级",
  "parentPhone": "13800138004",
  "classId": 1  // 可选
}
```

### 获取学生详情
```
GET /api/students/:id
```

**响应：**
```json
{
  "id": 1,
  "name": "张三",
  "grade": "一年级",
  "parentPhone": "13800138001",
  "classId": 1,
  "class": {...},
  "payments": [...]
}
```

### 更新学生
```
PUT /api/students/:id
```

### 删除学生
```
DELETE /api/students/:id
```

---

## 考勤管理

### 获取考勤记录
```
GET /api/attendances
GET /api/attendances?classId=1
GET /api/attendances?date=2026-03-09
GET /api/attendances?studentId=1
```

**响应：**
```json
[
  {
    "id": 1,
    "classId": 1,
    "studentId": 1,
    "date": "2026-03-09T00:00:00.000Z",
    "status": "present",  // present, leave, absent
    "student": {...},
    "class": {...}
  }
]
```

### 批量保存考勤
```
POST /api/attendances
```

**请求体：**
```json
{
  "classId": 1,
  "date": "2026-03-09",
  "records": [
    { "studentId": 1, "status": "present" },
    { "studentId": 2, "status": "leave" }
  ]
}
```

**响应：**
```json
{
  "count": 2
}
```

---

## 缴费管理

### 获取缴费记录
```
GET /api/payments
GET /api/payments?studentId=1
GET /api/payments?term=2026春季
GET /api/payments?status=paid  // joined, paid, unpaid, not_joined
```

**响应：**
```json
[
  {
    "id": 1,
    "studentId": 1,
    "term": "2026春季",
    "status": "paid",
    "amount": 3000,
    "paymentMethod": "wechat",  // wechat, alipay, bank
    "paidAt": "2026-03-09T10:00:00.000Z",
    "student": {
      "id": 1,
      "name": "张三",
      "class": {...}
    }
  }
]
```

### 创建缴费记录
```
POST /api/payments
```

**请求体：**
```json
{
  "studentId": 1,
  "term": "2026春季",
  "status": "joined",
  "amount": 3000  // 可选
}
```

### 获取缴费详情
```
GET /api/payments/:id
```

### 更新缴费记录
```
PUT /api/payments/:id
```

**请求体：**
```json
{
  "status": "paid",
  "amount": 3000,
  "paymentMethod": "wechat",
  "paidAt": "2026-03-09T10:00:00.000Z"
}
```

---

## 作业管理

### 获取作业列表
```
GET /api/homeworks
GET /api/homeworks?classId=1
```

**响应：**
```json
[
  {
    "id": 1,
    "title": "Unit 1 练习",
    "content": "完成课本第10-15页练习题",
    "dueDate": "2026-03-15T00:00:00.000Z",
    "createdAt": "2026-03-09T10:00:00.000Z",
    "homeworkClasses": [
      {
        "id": 1,
        "homeworkId": 1,
        "classId": 1,
        "class": {...}
      }
    ]
  }
]
```

### 创建作业
```
POST /api/homeworks
```

**请求体：**
```json
{
  "title": "Unit 2 练习",
  "content": "背诵单词表，完成练习册",
  "dueDate": "2026-03-20",
  "classIds": [1, 2]  // 可以分配给多个班级
}
```

### 获取作业详情
```
GET /api/homeworks/:id
```

### 删除作业
```
DELETE /api/homeworks/:id
```

---

## 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 认证失败
- `404` - 资源不存在
- `500` - 服务器错误

## 测试账号

- 用户名：`admin`
- 密码：`admin123`
