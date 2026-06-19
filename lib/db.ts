import { PrismaClient } from '@prisma/client'
import { ensureEnglishSlug } from './slug'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  return baseClient.$extends({
    query: {
      community: {
        async $allOperations({ operation, args, query }: { operation: string, args: any, query: (args: any) => Promise<any> }) {
          if (['create', 'update', 'upsert'].includes(operation)) {
            const data = operation === 'upsert' ? args.create : args.data
            if (data?.slug && typeof data.slug === 'string') {
              data.slug = ensureEnglishSlug(data.slug)
            }
            if (operation === 'upsert' && args.update?.slug) {
              args.update.slug = ensureEnglishSlug(args.update.slug)
            }
          }
          return query(args)
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 在所有环境下缓存实例（Serverless 环境需要）
globalForPrisma.prisma = prisma

export default prisma

// 用于 interactive transaction，直连 PostgreSQL 绕过 PgBouncer（transaction mode 不兼容）
function createDirectPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrismaTransaction = globalThis as unknown as {
  prismaTransaction: PrismaClient | undefined
}

export const prismaTransaction = globalForPrismaTransaction.prismaTransaction ?? createDirectPrismaClient()
globalForPrismaTransaction.prismaTransaction = prismaTransaction
