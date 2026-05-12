/**
 * 政策 summary 批量 AI 改写
 * - 从 MD 提取每条政策正文（去掉索引/元信息，只保留实质内容）
 * - DeepSeek 生成 50-80字高质量 summary
 * - 并发5，失败自动重试一次
 * - 同步清洗剩余脏 URL
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()
const API_KEY = process.env.DEEPSEEK_API_KEY || ''
const CONCURRENCY = 5

// ── 解析 MD，返回 title → 正文map ────────────────────────────────
function parseMdFullText(mdPath: string): Record<string, string> {
  const content = fs.readFileSync(mdPath, 'utf-8')
  const sections = content.split(/\n(?=### \d+\. )/)
  const result: Record<string, string> = {}

  for (const section of sections) {
    const titleMatch = section.match(/^### \d+\.\s+(.+)/m)
    if (!titleMatch) continue
    const title = titleMatch[1].trim()

    // 找到 "# 标题" 全文块开始位置（跳过元信息块）
    // 正文从第一个 "---" 分隔线之后开始
    const bodyStart = section.indexOf('\n---\n')
    let body = bodyStart > 0 ? section.slice(bodyStart + 5) : section

    // 去掉 Markdown 标题符号，清理空行
    body = body
      .replace(/^#{1,4}\s+.+$/gm, '') // 去掉所有 # 标题行
      .replace(/\*\*[^*]+\*\*[：:]\s*/g, '') // 去掉 **字段名**: 格式
      .replace(/^[-*]\s*(文号|发布日期|来源|获取状态|状态)[：:].+$/gm, '') // 去元信息行
      .replace(/^>\s*来源[：:].*$/gm, '') // 去来源行
      .replace(/\n{3,}/g, '\n\n') // 压缩多余空行
      .trim()

    // 取前1200字（足够判断核心扶持）
    result[title] = body.slice(0, 1200)
  }

  return result
}

// ── 解析 MD，返回 title → coreSupport ───────────────────────────
function parseCoreSupport(mdPath: string): Record<string, string> {
  const content = fs.readFileSync(mdPath, 'utf-8')
  const sections = content.split(/\n(?=### \d+\. )/)
  const result: Record<string, string> = {}
  for (const section of sections) {
    const titleMatch = section.match(/^### \d+\.\s+(.+)/m)
    if (!titleMatch) continue
    const title = titleMatch[1].trim()
    const csMatch = section.match(/\*\*核心扶持\*\*[：:]\s*(.+)/)
    if (csMatch) result[title] = csMatch[1].trim()
  }
  return result
}

// ── AI 生成 summary ───────────────────────────────────────────────
async function generateSummary(title: string, coreSupport: string, bodyText: string): Promise<string | null> {
  const prompt = `你是政策摘要编辑，请为以下OPC政策写一句60字以内的核心扶持摘要。
要求：
- 说清楚"给什么"（如：免费工位、算力补贴、资金支持、注册便利等）
- 说清楚关键数字（如有）
- 不要重复政策标题
- 不要"该政策"、"本政策"等废话开头
- 直接输出摘要文字，不要加引号

政策名：${title}
核心扶持字段：${coreSupport || '无'}
政策正文节选：
${bodyText.slice(0, 800)}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(20000),
      })
      const json = await resp.json() as any
      const result = json.choices?.[0]?.message?.content?.trim()
      if (result && result.length > 10) return result.slice(0, 100)
    } catch (e) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

// ── 并发执行器 ────────────────────────────────────────────────────
async function runConcurrent<T>(
  items: T[],
  fn: (item: T, idx: number) => Promise<void>,
  concurrency: number
) {
  let idx = 0
  async function worker() {
    while (idx < items.length) {
      const current = idx++
      await fn(items[current], current)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  const mdPath = '/Users/wei/Desktop/全国OPC专项政策全文汇编.md'
  console.log('📖 解析 MD...')
  const fullTextMap = parseMdFullText(mdPath)
  const coreSupportMap = parseCoreSupport(mdPath)
  console.log(`   正文数: ${Object.keys(fullTextMap).length}, 核心扶持数: ${Object.keys(coreSupportMap).length}\n`)

  const policies = await prisma.policy.findMany()
  console.log(`📊 数据库 ${policies.length} 条政策`)

  // 确定需要更新 summary 的条目（全量重写以保证质量）
  const toUpdate = policies // 全部重写
  console.log(`🔄 开始生成 summary（并发 ${CONCURRENCY}）...\n`)

  let done = 0, aiOk = 0, aiFail = 0, fallback = 0

  await runConcurrent(toUpdate, async (policy, _idx) => {
    const bodyText = fullTextMap[policy.title] || ''
    const coreSupport = coreSupportMap[policy.title] || ''

    let newSummary: string | null = null

    if (bodyText.length > 100) {
      // 有正文 → 用 AI
      newSummary = await generateSummary(policy.title, coreSupport, bodyText)
      if (newSummary) {
        aiOk++
      } else {
        // AI 失败 → 降级用核心扶持
        newSummary = coreSupport || null
        aiFail++
      }
    } else if (coreSupport) {
      // 无正文但有核心扶持 → 直接用
      newSummary = coreSupport
      fallback++
    }

    const updates: any = {}
    if (newSummary && newSummary !== policy.summary) {
      updates.summary = newSummary.slice(0, 120)
    }

    // 顺便清洗脏 URL
    if (policy.sourceUrl) {
      const cleaned = policy.sourceUrl
        .replace(/[（(][^）)]*[）)].*$/, '')
        .replace(/[^\x00-\x7F\-._~:/?#[\]@!$&'()*+,;=%]+$/, '')
        .trim()
      if (cleaned !== policy.sourceUrl && cleaned.startsWith('http')) {
        updates.sourceUrl = cleaned
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.policy.update({ where: { id: policy.id }, data: updates })
    }

    done++
    const summaryPreview = (updates.summary || policy.summary || '').slice(0, 40)
    process.stdout.write(`\r[${done}/${toUpdate.length}] ${policy.title.slice(0, 20).padEnd(20)} → ${summaryPreview}`.slice(0, 100))
  }, CONCURRENCY)

  console.log('\n\n✅ 完成:')
  console.log(`   AI 成功: ${aiOk} 条`)
  console.log(`   AI 失败降级: ${aiFail} 条`)
  console.log(`   直接用核心扶持: ${fallback} 条`)
  console.log(`   未能更新: ${toUpdate.length - aiOk - aiFail - fallback} 条`)

  // 质检
  const final = await prisma.policy.findMany({ select: { title: true, summary: true, sourceUrl: true } })
  const shortSummary = final.filter(p => !p.summary || p.summary.length < 15)
  const badUrl = final.filter(p => p.sourceUrl && (p.sourceUrl.includes('（') || !p.sourceUrl.startsWith('http')))
  
  console.log('\n🔍 质检结果:')
  console.log(`   有URL: ${final.filter(p => p.sourceUrl).length}/${final.length}`)
  console.log(`   脏URL: ${badUrl.length}`)
  console.log(`   summary < 15字: ${shortSummary.length}`)
  
  if (shortSummary.length > 0) {
    console.log('\n   仍需人工处理:')
    shortSummary.forEach(p => console.log(`   ⚠️  ${p.title.slice(0, 35)} → "${p.summary}"`)  )
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
