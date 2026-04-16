import { PrismaClient } from '@prisma/client'
import { pinyin } from 'pinyin-pro'
import * as fs from 'fs'

const prisma = new PrismaClient()

function toEnglishSlug(chineseSlug: string): string {
  const py = pinyin(chineseSlug, {
    toneType: 'none',
    separator: '-',
    nonZh: 'consecutive',
  })
  return py
    .toLowerCase()
    .replace(/[·•·\s]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const communities = await prisma.community.findMany({
    select: { id: true, name: true, slug: true }
  })

  const chineseSlugs = communities.filter(c => /[\u4e00-\u9fff]/.test(c.slug))
  console.log(`需要转换: ${chineseSlugs.length} 条`)

  const mapping: Record<string, string> = {}
  const updates: Array<{ id: string; oldSlug: string; newSlug: string }> = []

  const existingSlugs = new Set(
    communities
      .filter(c => !/[\u4e00-\u9fff]/.test(c.slug))
      .map(c => c.slug)
  )

  for (const c of chineseSlugs) {
    let newSlug = toEnglishSlug(c.slug)
    let suffix = 0
    while (existingSlugs.has(newSlug)) {
      suffix++
      newSlug = `${toEnglishSlug(c.slug)}-${suffix}`
    }
    existingSlugs.add(newSlug)
    mapping[c.slug] = newSlug
    updates.push({ id: c.id, oldSlug: c.slug, newSlug })
  }

  console.log('\n=== 转换预览（前10条）===')
  updates.slice(0, 10).forEach(u => {
    console.log(`  ${u.oldSlug}`)
    console.log(`  → ${u.newSlug}`)
    console.log()
  })

  fs.writeFileSync(
    'scripts/slug-mapping.json',
    JSON.stringify(mapping, null, 2)
  )
  console.log('映射表已写入 scripts/slug-mapping.json')

  console.log('\n开始更新数据库...')
  let success = 0
  for (const u of updates) {
    try {
      await prisma.community.update({
        where: { id: u.id },
        data: { slug: u.newSlug }
      })
      success++
      if (success % 10 === 0) console.log(`  已完成 ${success}/${updates.length}`)
    } catch (e) {
      console.error(`  失败: ${u.oldSlug}`, e)
    }
  }
  console.log(`\n完成: ${success}/${updates.length} 条更新成功`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
