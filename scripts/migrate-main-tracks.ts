/**
 * 数据迁移脚本：mainTrack → mainTracks
 *
 * 旧 key 映射：
 *   ai_product → ai_saas
 *   design / consulting / ecommerce / content / dev → 同名
 *   other → []（空数组，不迁移）
 *   自定义文本 → 原样放入数组
 *
 * 用法（连生产 DB）：
 *   DATABASE_URL="postgresql://opc_admin:xxx@124.221.187.63:5432/opc" npx tsx scripts/migrate-main-tracks.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KEY_MAP: Record<string, string> = {
  ai_product: 'ai_saas',
  design:     'design',
  consulting: 'consulting',
  ecommerce:  'ecommerce',
  content:    'content',
  dev:        'dev',
}

async function main() {
  const users = await prisma.user.findMany({
    where: { mainTrack: { not: null } },
    select: { id: true, mainTrack: true, mainTracks: true },
  })

  console.log(`找到 ${users.length} 个有 mainTrack 的用户`)

  let migrated = 0
  let skipped = 0

  for (const user of users) {
    const old = user.mainTrack!.trim()

    // 已经迁移过（mainTracks 非空），跳过
    if (user.mainTracks && user.mainTracks.length > 0) {
      skipped++
      continue
    }

    // other → 空数组，不写入
    if (old === 'other' || old === '') {
      skipped++
      continue
    }

    // 有映射 key → 用新 key；否则原样保留
    const newValue = KEY_MAP[old] ?? old

    await prisma.user.update({
      where: { id: user.id },
      data: { mainTracks: [newValue] },
    })

    migrated++
  }

  console.log(`迁移完成：migrated=${migrated}, skipped=${skipped}`)
  console.log('验证中...')

  const remaining = await prisma.user.count({
    where: {
      mainTrack: { not: null },
      mainTracks: { isEmpty: true },
    },
  })
  console.log(`仍有 mainTrack 但 mainTracks 为空的用户：${remaining}（应为 0 或 other 数量）`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
