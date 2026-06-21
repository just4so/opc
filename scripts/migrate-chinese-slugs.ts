/**
 * 迁移脚本：将中文 Project slug 转换为拼音 slug
 * 旧 slug 保存到 slugAliases 字段，用于 301 重定向
 *
 * 运行：npx tsx scripts/migrate-chinese-slugs.ts
 * 幂等：已迁移的 slug 不会重复处理
 */

import { PrismaClient } from '@prisma/client'
import { pinyin } from 'pinyin-pro'

const prisma = new PrismaClient()

function toEnglishSlug(input: string): string {
  const py = pinyin(input, {
    toneType: 'none',
    separator: '-',
    nonZh: 'consecutive',
  })
  return py
    .toLowerCase()
    .replace(/[·•·\s（）()【】「」《》、，。！？；：""'']+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function hasChinese(str: string): boolean {
  return /[一-鿿]/.test(str)
}

async function main() {
  const allProjects = await prisma.project.findMany({
    select: { id: true, slug: true, slugAliases: true, name: true },
  })

  const chineseProjects = allProjects.filter(p => hasChinese(p.slug))
  console.log(`找到 ${chineseProjects.length} 个中文 slug 需要迁移`)

  const allSlugs = new Set(allProjects.map(p => p.slug))
  let migrated = 0
  let skipped = 0
  let conflicts = 0

  for (const project of chineseProjects) {
    // 已经在 slugAliases 里说明已迁移过，跳过
    if (project.slugAliases.includes(project.slug)) {
      skipped++
      continue
    }

    // 提取后缀（最后一段 6-10 位字母数字）
    const parts = project.slug.split('-')
    const lastPart = parts[parts.length - 1]
    const hasSuffix = /^[a-z0-9]{6,10}$/.test(lastPart)

    let newSlug: string
    if (hasSuffix) {
      const suffix = lastPart
      const pinyinBase = toEnglishSlug(project.name).slice(0, 60)
      newSlug = pinyinBase + '-' + suffix
    } else {
      newSlug = toEnglishSlug(project.name) + '-' + Date.now().toString(36)
    }

    // 检查冲突
    if (allSlugs.has(newSlug) && newSlug !== project.slug) {
      console.log(`⚠️ 冲突跳过: ${project.slug} → ${newSlug}`)
      conflicts++
      continue
    }

    try {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          slug: newSlug,
          slugAliases: { push: project.slug },
        },
      })
      allSlugs.delete(project.slug)
      allSlugs.add(newSlug)
      console.log(`✅ ${project.slug} → ${newSlug}`)
      migrated++
    } catch (err) {
      console.error(`❌ 失败: ${project.slug}`, err)
    }
  }

  console.log(`\n完成：迁移 ${migrated}，跳过 ${skipped}，冲突 ${conflicts}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
