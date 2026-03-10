import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  console.log('[Prisma] Creating client, TURSO_DATABASE_URL exists:', !!url)

  if (url && url.startsWith('libsql://')) {
    try {
      console.log('[Prisma] Using Turso/LibSQL adapter')
      const libsql = createClient({ url, authToken })
      const adapter = new PrismaLibSQL(libsql)
      return new PrismaClient({ adapter })
    } catch (error) {
      console.error('[Prisma] Failed to create LibSQL client:', error)
      throw error
    }
  }
  
  console.log('[Prisma] Using default SQLite')
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
