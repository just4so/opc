/**
 * fix-content-type.ts
 * 修复 R2 上 Content-Type 为 image/jpg（非标准）的图片
 * 原地 CopyObject 覆盖 metadata，改为 image/jpeg
 * 不改 DB，不改文件内容，只改 R2 元数据
 */
import { PrismaClient } from '@prisma/client'
import {
  S3Client,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const R2_BUCKET = 'opcquan-media'
const R2_PUBLIC_BASE = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev'
const R2_ENDPOINT = `https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com`

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const prisma = new PrismaClient()

async function getContentType(key: string): Promise<string | undefined> {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return res.ContentType
  } catch {
    return undefined
  }
}

async function fixContentType(key: string): Promise<void> {
  await s3.send(new CopyObjectCommand({
    Bucket: R2_BUCKET,
    CopySource: `${R2_BUCKET}/${key}`,
    Key: key,
    ContentType: 'image/jpeg',
    MetadataDirective: 'REPLACE',
  }))
}

async function main() {
  // 查出所有有 coverImage 的社区
  const communities = await prisma.community.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, name: true, slug: true, coverImage: true },
  })

  console.log(`共 ${communities.length} 个社区有 coverImage，开始检查...\n`)

  let checked = 0
  let fixed = 0
  let skipped = 0
  let missing = 0
  let failed = 0

  for (const c of communities) {
    const url = c.coverImage!
    const key = url.replace(`${R2_PUBLIC_BASE}/`, '')

    const contentType = await getContentType(key)
    checked++

    if (contentType === undefined) {
      console.log(`[MISSING] ${c.name} → ${key}`)
      missing++
      continue
    }

    if (contentType === 'image/jpg') {
      try {
        await fixContentType(key)
        console.log(`[FIXED] ${c.name}`)
        fixed++
      } catch (err) {
        console.error(`[ERROR] ${c.name}: ${err}`)
        failed++
      }
    } else {
      // 正常的跳过，不输出避免刷屏
      skipped++
    }

    // 每50条输出进度
    if (checked % 50 === 0) {
      console.log(`\n--- 进度: ${checked}/${communities.length} | 已修: ${fixed} | 跳过: ${skipped} | 缺失: ${missing} ---\n`)
    }
  }

  console.log('\n=== 完成 ===')
  console.log(`检查: ${checked} | 修复: ${fixed} | 跳过(已正常): ${skipped} | 文件不存在: ${missing} | 失败: ${failed}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
