import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function migrate() {
  console.log('开始数据库迁移...')

  const migrations = [
    // Class表新增字段
    `ALTER TABLE Class ADD COLUMN reminder_enabled INTEGER DEFAULT 0`,
    `ALTER TABLE Class ADD COLUMN reminder_time TEXT DEFAULT '20:00'`,
    // ChatMessage表
    `CREATE TABLE IF NOT EXISTS ChatMessage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      content TEXT NOT NULL,
      msg_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_chat_message_chat_created ON ChatMessage(chat_id, created_at)`,
    // ChatSummary表
    `CREATE TABLE IF NOT EXISTS ChatSummary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      date DATETIME NOT NULL,
      summary TEXT NOT NULL,
      message_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chat_id, date)
    )`,
  ]

  for (const sql of migrations) {
    try {
      await client.execute(sql)
      console.log('✅', sql.slice(0, 60) + '...')
    } catch (error: any) {
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        console.log('⏭️ 已存在，跳过:', sql.slice(0, 40) + '...')
      } else {
        console.error('❌ 失败:', sql.slice(0, 40), error.message)
      }
    }
  }

  console.log('\n✅ 数据库迁移完成!')
}

migrate().catch(console.error)
