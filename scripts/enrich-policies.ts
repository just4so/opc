/**
 * 政策数据质量修复脚本
 * 1. 清洗 sourceUrl（去括号注释）
 * 2. 用 MD 核心扶持字段覆盖 summary
 * 3. 补充发布日期到 Policy.updatedAt（仅日志）
 * 4. 无 URL 的48条 → 用 DeepSeek 从正文提取/推断官方来源
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()
const API_KEY = process.env.DEEPSEEK_API_KEY || ''
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

// ── Step 1: 解析 MD 文件 ──────────────────────────────────────────
function parseMd(mdPath: string) {
  const content = fs.readFileSync(mdPath, 'utf-8')
  const sections = content.split(/\n(?=### \d+\. )/)

  const policyData: Record<string, {
    coreSupport: string
    rawUrl: string | null
    cleanUrl: string | null
    publishedDate: string | null
    fullText: string
  }> = {}

  for (const section of sections) {
    const titleMatch = section.match(/^### \d+\.\s+(.+)/m)
    if (!titleMatch) continue
    const title = titleMatch[1].trim()

    // 核心扶持
    const csMatch = section.match(/\*\*核心扶持\*\*[：:]\s*(.+)/)
    const coreSupport = csMatch ? csMatch[1].trim() : ''

    // 原始URL（含注释）
    const urlPatterns = [
      /[-*]\s*来源[12]?[：:]\s*(https?:\/\/[^\s\n>）\)（]+)/,
      />\s*来源[12]?[：:]\s*(https?:\/\/[^\s\n>）\)（]+)/,
      /来源[：:]\s*(https?:\/\/[^\s\n（\(>）\)]+)/,
    ]
    let rawUrl: string | null = null
    let cleanUrl: string | null = null
    for (const pat of urlPatterns) {
      const m = section.match(pat)
      if (m) {
        rawUrl = m[1].trim()
        // 去掉末尾多余中文/括号
        cleanUrl = rawUrl.replace(/[（(][^）)]*[）)].*$/, '').replace(/[^\x00-\x7F]+$/, '').trim()
        break
      }
    }

    // 发布日期
    const dateMatch = section.match(/发布日期[：:]\s*(\d{4}[-年]\d{1,2}[-月]?\d{0,2})/)
    const publishedDate = dateMatch ? dateMatch[1].replace(/[年月]/g, '-').replace(/-$/, '') : null

    policyData[title] = { coreSupport, rawUrl, cleanUrl, publishedDate, fullText: section }
  }

  return policyData
}

// ── Step 2: AI 提取/验证 URL ──────────────────────────────────────
async function aiExtractUrl(title: string, province: string, city: string | null, fullText: string): Promise<string | null> {
  if (!API_KEY) return null
  
  // 截取正文前1500字
  const excerpt = fullText.slice(0, 1500)
  
  const prompt = `从以下政策文档内容中，提取该政策的官方来源URL。
只返回一个完整、干净的URL（http或https开头），不要加任何说明或注释。
如果没有找到有效URL，返回 null。

政策标题：${title}
地区：${province} ${city || ''}

文档内容：
${excerpt}`

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const json = await resp.json() as any
    const result = json.choices?.[0]?.message?.content?.trim()
    if (!result || result === 'null' || result.toLowerCase() === 'null') return null
    // 验证是URL格式
    if (result.startsWith('http')) return result
    return null
  } catch {
    return null
  }
}

// ── Step 3: AI 改写 summary ───────────────────────────────────────
async function aiEnhanceSummary(title: string, coreSupport: string, excerpt: string): Promise<string> {
  // coreSupport 已经够好就直接用
  if (coreSupport && coreSupport.length > 15) return coreSupport
  
  if (!API_KEY || excerpt.length < 100) return coreSupport || title
  
  const prompt = `根据以下政策内容，用不超过60字写出该政策的核心扶持内容摘要（直接写扶持内容，不要包含政策名称，不要有废话）：

${excerpt.slice(0, 800)}`

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const json = await resp.json() as any
    return json.choices?.[0]?.message?.content?.trim() || coreSupport
  } catch {
    return coreSupport
  }
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  const mdPath = '/Users/wei/Desktop/全国OPC专项政策全文汇编.md'
  console.log('📖 解析 MD 文件...')
  const mdData = parseMd(mdPath)
  console.log(`   解析到 ${Object.keys(mdData).length} 条政策数据`)

  const policies = await prisma.policy.findMany()
  console.log(`📊 数据库 ${policies.length} 条政策\n`)

  let updatedUrl = 0, updatedSummary = 0, aiUsed = 0, noUrlFinal = 0

  for (const policy of policies) {
    const md = mdData[policy.title]
    const updates: any = {}

    // ── URL 处理 ──
    const currentUrl = policy.sourceUrl
    const mdCleanUrl = md?.cleanUrl

    if (currentUrl) {
      // 清洗现有脏 URL（去括号注释）
      const cleaned = currentUrl
        .replace(/[（(][^）)]*[）)].*$/, '')
        .replace(/[^\x00-\x7F]+$/, '')
        .replace(/[（(].*/, '')
        .trim()
      if (cleaned !== currentUrl && cleaned.startsWith('http')) {
        updates.sourceUrl = cleaned
        updatedUrl++
      }
    } else if (mdCleanUrl) {
      updates.sourceUrl = mdCleanUrl
      updatedUrl++
    } else if (md?.fullText) {
      // 尝试 AI 提取
      const aiUrl = await aiExtractUrl(policy.title, policy.province, policy.city, md.fullText)
      if (aiUrl) {
        updates.sourceUrl = aiUrl
        updatedUrl++
        aiUsed++
        console.log(`🤖 AI URL: ${policy.title.slice(0, 30)} → ${aiUrl.slice(0, 60)}`)
      } else {
        noUrlFinal++
      }
    } else {
      noUrlFinal++
    }

    // ── summary 处理 ──
    const coreSupport = md?.coreSupport || ''
    const currentSummary = policy.summary || ''
    
    // 需要改写：当前 summary 太短(<15字) 或 和标题高度重复
    const needsUpdate = currentSummary.length < 15 ||
      currentSummary === policy.title ||
      policy.title.includes(currentSummary.replace(/[+，。；;]/g, '').slice(0, 8))

    if (needsUpdate) {
      const newSummary = await aiEnhanceSummary(policy.title, coreSupport, md?.fullText || '')
      if (newSummary && newSummary !== currentSummary) {
        updates.summary = newSummary.slice(0, 100) // 硬限100字
        updatedSummary++
        if (!coreSupport || coreSupport.length <= 15) aiUsed++
      }
    } else if (coreSupport && coreSupport.length > currentSummary.length + 5) {
      // MD 核心扶持比当前更丰富就覆盖
      updates.summary = coreSupport.slice(0, 100)
      updatedSummary++
    }

    if (Object.keys(updates).length > 0) {
      await prisma.policy.update({ where: { id: policy.id }, data: updates })
    }
  }

  console.log('\n✅ 完成:')
  console.log(`   URL 更新/清洗: ${updatedUrl} 条`)
  console.log(`   summary 更新:  ${updatedSummary} 条`)
  console.log(`   AI 调用次数:   ${aiUsed}`)
  console.log(`   最终无URL:     ${noUrlFinal} 条`)

  // 最终质检
  const final = await prisma.policy.findMany({ select: { title: true, summary: true, sourceUrl: true } })
  const badUrl = final.filter(p => p.sourceUrl && p.sourceUrl.includes('（'))
  const shortSummary = final.filter(p => !p.summary || p.summary.length < 10)
  console.log(`\n🔍 质检:`)
  console.log(`   有URL: ${final.filter(p => p.sourceUrl).length}/${final.length}`)
  console.log(`   脏URL残留: ${badUrl.length}`)
  console.log(`   summary<10字: ${shortSummary.length}`)
  if (badUrl.length > 0) badUrl.forEach(p => console.log('   ⚠️', p.title.slice(0, 30), p.sourceUrl?.slice(0, 60)))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
