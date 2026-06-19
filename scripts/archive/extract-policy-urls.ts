import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const md = fs.readFileSync('/Users/wei/Desktop/全国OPC专项政策全文汇编.md', 'utf-8')
  
  // 按 "### N. 标题" 分块（每个政策入口）
  const sections = md.split(/(?=\n### \d+\. )/)
  
  const urlMap: Record<string, string> = {}
  
  for (const section of sections) {
    // 提取 ### N. 标题
    const titleMatch = section.match(/^### \d+\.\s+(.+)/m)
    if (!titleMatch) continue
    const title = titleMatch[1].trim()
    
    // 优先取 "# 标题" 全文块下的 "- 来源：URL"
    // 格式: - 来源：https://... 或 - 来源：http://...
    const urlMatch = section.match(/[-*]\s*来源[12]?[：:]\s*(https?:\/\/[^\s\n>）\)]+)/)
    if (urlMatch) {
      urlMap[title] = urlMatch[1].trim()
    }
    
    // 备用：找 "> 来源：URL" 格式
    if (!urlMap[title]) {
      const altMatch = section.match(/>\s*来源[12]?[：:]\s*(https?:\/\/[^\s\n>）\)]+)/)
      if (altMatch) urlMap[title] = altMatch[1].trim()
    }
  }
  
  console.log(`解析到 ${Object.keys(urlMap).length} 条有URL的政策\n`)
  
  const policies = await prisma.policy.findMany({ select: { id: true, title: true, sourceUrl: true } })
  console.log(`数据库中 ${policies.length} 条政策\n`)
  
  let updated = 0, alreadyHas = 0, notFound: string[] = []
  
  for (const policy of policies) {
    if (policy.sourceUrl) { alreadyHas++; continue }
    
    // 精确匹配
    let url = urlMap[policy.title]
    
    // 模糊匹配：标题前20字符
    if (!url) {
      const key = Object.keys(urlMap).find(k =>
        k.slice(0, 20) === policy.title.slice(0, 20)
      )
      if (key) url = urlMap[key]
    }
    
    if (url) {
      await prisma.policy.update({ where: { id: policy.id }, data: { sourceUrl: url } })
      updated++
      console.log(`✅ ${policy.title.slice(0, 35).padEnd(35)} → ${url.slice(0, 55)}`)
    } else {
      notFound.push(policy.title)
    }
  }
  
  console.log(`\n已有URL: ${alreadyHas} 条`)
  console.log(`本次更新: ${updated} 条`)
  console.log(`未找到URL(${notFound.length}条，通常是官方未公开全文):`)
  notFound.forEach(t => console.log(`  ❌ ${t}`))
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
