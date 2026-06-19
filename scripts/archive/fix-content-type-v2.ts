/**
 * fix-content-type-v2.ts
 * 并发修复 R2 上 Content-Type 为 image/jpg 的图片
 */
import { PrismaClient } from '@prisma/client'
import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const R2_BUCKET = 'opcquan-media'
const R2_PUBLIC_BASE = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev'
const R2_ENDPOINT = `https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com`
const CONCURRENCY = 20

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const prisma = new PrismaClient()

async function checkAndFix(name: string, key: string): Promise<'fixed' | 'ok' | 'missing' | 'error'> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    if (head.ContentType === 'image/jpg') {
      await s3.send(new CopyObjectCommand({
        Bucket: R2_BUCKET,
        CopySource: `${R2_BUCKET}/${key}`,
        Key: key,
        ContentType: 'image/jpeg',
        MetadataDirective: 'REPLACE',
      }))
      console.log(`[FIXED] ${name}`)
      return 'fixed'
    }
    return 'ok'
  } catch (e: any) {
    if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) {
      return 'missing'
    }
    console.error(`[ERROR] ${name}: ${e?.message}`)
    return 'error'
  }
}

async function runBatch<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    console.log(`进度: ${Math.min(i + concurrency, items.length)}/${items.length}`)
  }
  return results
}

async function main() {
  const communities = await prisma.community.findMany({
    where: { coverImage: { not: null } },
    select: { name: true, coverImage: true },
  })

  console.log(`共 ${communities.length} 个社区，并发 ${CONCURRENCY} 开始处理...\n`)

  const stats = { fixed: 0, ok: 0, missing: 0, error: 0 }

  const results = await runBatch(
    communities,
    async (c) => {
      const key = c.coverImage!.replace(`${R2_PUBLIC_BASE}/`, '')
      return checkAndFix(c.name, key)
    },
    CONCURRENCY
  )

  for (const r of results) stats[r]++

  console.log('\n=== 完成 ===')
  console.log(`修复: ${stats.fixed} | 正常: ${stats.ok} | 文件不存在: ${stats.missing} | 失败: ${stats.error}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
