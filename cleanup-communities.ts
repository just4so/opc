/**
 * 社区数据清理脚本
 * 1. 删除完全重复的社区（同名同城）
 * 2. 合并相似名称的社区
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 相似名称映射：保留名称 -> 要删除的名称列表
const SIMILAR_NAMES: Record<string, string[]> = {
  // 成都
  '天府软件π立方OPC社区': ['天府软件π立方 OPC社区'],
  // 上海
  '零界魔方OPC社区': ['临港零界魔方'],
  '视听静界·π空间OPC创新社区': ['静安视听静界·π空间OPC社区'],
  // 深圳
  '璞跃中国大湾区国际创新中心': ['璞跃创新中心'],
}

async function main() {
  console.log('🧹 开始清理社区数据...\n')

  let deletedDuplicates = 0
  let mergedSimilar = 0

  // 1. 查找并删除完全重复的社区（同名同城）
  console.log('=== 第一步：删除完全重复的社区 ===')

  const allCommunities = await prisma.community.findMany({
    select: { id: true, name: true, city: true, slug: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  // 按 name+city 分组
  const grouped = new Map<string, typeof allCommunities>()
  allCommunities.forEach(c => {
    const key = `${c.name}|${c.city}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(c)
  })

  // 删除重复的（保留最早的那条）
  for (const [key, communities] of Array.from(grouped.entries())) {
    if (communities.length > 1) {
      const [keep, ...toDelete] = communities
      console.log(`🔍 发现重复: ${key}`)
      console.log(`   保留: ${keep.slug} (${keep.createdAt.toISOString().slice(0, 10)})`)

      for (const c of toDelete) {
        console.log(`   删除: ${c.slug}`)
        await prisma.community.delete({ where: { id: c.id } })
        deletedDuplicates++
      }
    }
  }

  console.log(`\n✅ 删除了 ${deletedDuplicates} 条完全重复的记录\n`)

  // 2. 合并相似名称的社区
  console.log('=== 第二步：合并相似名称的社区 ===')

  for (const [keepName, deleteNames] of Object.entries(SIMILAR_NAMES)) {
    for (const deleteName of deleteNames) {
      const toDelete = await prisma.community.findFirst({
        where: { name: deleteName }
      })

      if (toDelete) {
        console.log(`🔄 合并: "${deleteName}" -> "${keepName}"`)
        await prisma.community.delete({ where: { id: toDelete.id } })
        mergedSimilar++
      }
    }
  }

  console.log(`\n✅ 合并了 ${mergedSimilar} 条相似名称的记录\n`)

  // 3. 统计结果
  const finalCount = await prisma.community.count()
  console.log('=== 清理完成 ===')
  console.log(`删除完全重复: ${deletedDuplicates} 条`)
  console.log(`合并相似名称: ${mergedSimilar} 条`)
  console.log(`当前社区总数: ${finalCount} 个`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
