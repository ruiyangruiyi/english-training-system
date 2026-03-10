import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function seed() {
  console.log('开始初始化数据...')

  // 检查admin是否存在
  const existing = await client.execute({
    sql: 'SELECT * FROM User WHERE username = ?',
    args: ['admin']
  })

  if (existing.rows.length > 0) {
    console.log('admin用户已存在，更新密码...')
    await client.execute({
      sql: 'UPDATE User SET password = ?, status = ? WHERE username = ?',
      args: ['admin123', 'active', 'admin']
    })
  } else {
    console.log('创建admin用户...')
    await client.execute({
      sql: `INSERT INTO User (username, password, name, role, status, phone, wechat, subject) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['admin', 'admin123', '管理员', 'admin', 'active', '13800000000', 'admin_wechat', '管理']
    })
  }

  // teacher1
  const t1 = await client.execute({
    sql: 'SELECT * FROM User WHERE username = ?',
    args: ['teacher1']
  })

  if (t1.rows.length > 0) {
    console.log('teacher1用户已存在，更新密码...')
    await client.execute({
      sql: 'UPDATE User SET password = ?, status = ? WHERE username = ?',
      args: ['teacher123', 'active', 'teacher1']
    })
  } else {
    console.log('创建teacher1用户...')
    await client.execute({
      sql: `INSERT INTO User (username, password, name, role, status, phone, wechat, subject) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['teacher1', 'teacher123', '王老师', 'teacher', 'active', '13800000001', 'wang_laoshi', '英语']
    })
  }

  // teacher2
  const t2 = await client.execute({
    sql: 'SELECT * FROM User WHERE username = ?',
    args: ['teacher2']
  })

  if (t2.rows.length > 0) {
    console.log('teacher2用户已存在，更新密码...')
    await client.execute({
      sql: 'UPDATE User SET password = ?, status = ? WHERE username = ?',
      args: ['teacher123', 'active', 'teacher2']
    })
  } else {
    console.log('创建teacher2用户...')
    await client.execute({
      sql: `INSERT INTO User (username, password, name, role, status, phone, wechat, subject) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['teacher2', 'teacher123', '李老师', 'teacher', 'active', '13800000002', 'li_laoshi', '数学']
    })
  }

  // 验证
  const users = await client.execute('SELECT id, username, password, name, role, status FROM User')
  console.log('\n当前用户列表:')
  users.rows.forEach(row => {
    console.log(`  - ${row.username} (${row.role}) password=${row.password} status=${row.status}`)
  })

  console.log('\n✅ 数据初始化完成!')
}

seed().catch(console.error)
