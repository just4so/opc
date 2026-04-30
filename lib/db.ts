import { PrismaClient } from '@prisma/client'
import { ensureEnglishSlug } from './slug'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // 兜底：任何入口写入 Community 时，自动将 slug 转为纯拼音
  client.$use(async (params, next) => {
    if (params.model === 'Community') {
      if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
        const data = params.action === 'upsert'
          ? params.args.create
          : params.args.data
        if (data?.slug && typeof data.slug === 'string') {
          data.slug = ensureEnglishSlug(data.slug)
        }
        // upsert 的 update 部分也要处理
        if (params.action === 'upsert' && params.args.update?.slug) {
          params.args.update.slug = ensureEnglishSlug(params.args.update.slug)
        }
      }
    }
    return next(params)
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 在所有环境下缓存实例（Serverless 环境需要）
globalForPrisma.prisma = prisma

export default prisma
