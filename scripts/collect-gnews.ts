/**
 * Google News 采集脚本（独立进程，绕过 Next.js RSC 限制）
 * 用法: npx tsx scripts/collect-gnews.ts [daysBack=3]
 *
 * 5 个内容维度：政策动向 / 社区动态 / 活动赛事 / 实战案例 / 新锐观点
 * AI 判断规则统一使用 lib/aiJudge.ts
 *
 * 流程：
 *   Phase A: 拉取 8 个 Google News RSS → ~97条原始（含 title/pubDate）
 *   Phase B: 标题 AI 初筛 → 过滤明显无关，剩 10-20条（减少解码量）
 *   Phase C: 只对初筛通过的条目解码 URL（避免 429 限速）
 *   Phase D: 去重 + AI 精判 + 入库
 *
 * 更新时间：2026-05-30
 */
import { execSync } from 'child_process'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { getAIClient, judgeItem, judgeItemsBatch, isTooOld } from '../lib/radar/aiJudge'

const prisma = new PrismaClient()

const PROXY = process.env.HTTP_PROXY || 'http://127.0.0.1:7898'

/**
 * 8 个查询，覆盖 5 个内容维度
 */
const QUERIES = [
  // 政策动向（2条）
  { q: '("OPC" OR "一人公司" OR "超级个体") (政策 OR 补贴 OR 扶持 OR 新政)', category: 'policy' },
  { q: '("OPC" OR "一人公司" OR "OPC社区") (落地 OR 试点 OR 实施 OR 申请)', category: 'policy' },
  // 社区动态（1条）
  { q: '("OPC社区" OR "一人公司" OR "超级个体") (开业 OR 入驻 OR 揭牌 OR 落地)', category: 'community' },
  // 活动赛事（1条）
  { q: '("OPC" OR "一人公司" OR "超级个体") (峰会 OR 沙龙 OR 路演 OR 大赛 OR 论坛)', category: 'event' },
  // 实战案例（2条）
  { q: '("一人公司" OR "独立创业者" OR "超级个体") (收入 OR 盈利 OR 月入 OR 变现)', category: 'content' },
  { q: '("独立开发者" OR "一人公司" OR "超级个体") (产品 OR 出海 OR 副业 OR 项目)', category: 'content' },
  // 新锐观点（2条）
  { q: '("OPC" OR "一人公司" OR "超级个体") (趋势 OR 洞察 OR 分析 OR 报告)', category: 'opinion' },
  { q: '("超级个体" OR "一人公司" OR "独立创业") (未来 OR 机会 OR 挑战 OR 转型)', category: 'opinion' },
]

// ─── RSS 解析工具 ──────────────────────────────────────────────────────────

function fetchGNews(url: string): string {
  try {
    return execSync(`curl -s --max-time 15 -x ${PROXY} "${url}"`, {
      encoding: 'utf-8', timeout: 18000,
    })
  } catch { return '' }
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1] : null
}

function stripCdata(s: string) { return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() }
function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/\s+/g, ' ').trim()
}

function parseFeed(xml: string, defaultCat: string) {
  const items: Array<{ title: string; url: string; source: string; publishedAt: Date | null; content: string; category: string }> = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const b = m[1]
    const titleRaw = extractTag(b, 'title')
    const linkRaw = extractTag(b, 'link') || extractTag(b, 'guid')
    const pubDate = extractTag(b, 'pubDate')
    const desc = extractTag(b, 'description') || ''
    if (!titleRaw || !linkRaw) continue
    const dash = titleRaw.lastIndexOf(' - ')
    const title = dash > 0 ? titleRaw.slice(0, dash).trim() : titleRaw.trim()
    const source = dash > 0 ? titleRaw.slice(dash + 3).trim() : 'Google News'
    // 旧格式兼容：?url= 参数
    const realMatch = linkRaw.match(/[?&]url=([^&]+)/)
    const url = realMatch ? decodeURIComponent(realMatch[1]) : stripCdata(linkRaw)
    items.push({
      title: stripCdata(title),
      url,
      source,
      publishedAt: pubDate ? new Date(pubDate) : null,
      content: stripHtml(stripCdata(desc)).slice(0, 500),
      category: defaultCat,
    })
  }
  return items
}

/** Google News 中间链接判断 */
function isGoogleNewsProxy(url: string): boolean {
  return url.includes('news.google.com/rss/articles/') || url.includes('news.google.com/articles/')
}

// ─── Phase B: 标题 AI 初筛 ─────────────────────────────────────────────────
// 只用 title + source + pubDate 判断，无需正文，速度快（8条/批，秒级完成）
// 目的：把解码量从 97 条压缩到 10-20 条，避免触发 429 限速
// 策略：宽松过滤，不确定时保留（宁可多解码几条，不能漏掉相关内容）

type RawItem = { title: string; url: string; source: string; publishedAt: Date | null; content: string; category: string }

// 解码量安全上限：单次运行超过此数量会触发 429
const MAX_DECODE = 20

async function quickFilter(
  ai: ReturnType<typeof getAIClient>,
  items: RawItem[]
): Promise<RawItem[]> {
  if (!ai || items.length === 0) return items.slice(0, MAX_DECODE)

  // 给每条打分（0-3），取 TOP MAX_DECODE 条
  const BATCH = 10
  const scores: number[] = new Array(items.length).fill(1)  // 默认分1（不确定，保留）

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    const lines = batch.map((it, j) =>
      `${j + 1}. 标题：${it.title} | 来源：${it.source}`
    ).join('\n')

    const prompt = `你是 OPC 行业信号分析师。以下 ${batch.length} 条新闻标题，对每条与「OPC/一人公司/超级个体/独立创业/OPC社区」的相关程度打分。

${lines}

评分标准：
3 = 高度相关：标题明确含 OPC/一人公司/超级个体/独立创业/OPC社区，且有实质内容（政策/数字/具体事件）
2 = 可能相关：含相关词汇但内容不确定，或大公司动态但涉及创业者生态
1 = 弱相关：泛创业/泛AI，与 OPC 关联模糊
0 = 无关：纯金融/房产/娱乐/法律意义上的一人公司（股权/工商注册/证券开户语境）/与独立创业者无关的大公司新闻

只返回 JSON 数组，长度必须是 ${batch.length}：
[{"index":1,"score":3},{"index":2,"score":0}]`

    try {
      const comp = await Promise.race([
        ai.chat.completions.create({
          model: 'deepseek-v4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('quickFilter timeout')), 20000)),
      ]) as any
      const text = comp.choices[0]?.message?.content ?? ''
      const m = text.match(/\[[\s\S]*\]/)
      if (!m) throw new Error('无法解析响应')
      const arr = JSON.parse(m[0]) as Array<{ index: number; score: number }>
      for (const r of arr) {
        if (r.index >= 1 && r.index <= batch.length) {
          scores[i + r.index - 1] = r.score ?? 1
        }
      }
    } catch {
      // AI 失败：整批保持默认分1，不丢内容
    }
  }

  // 按分数降序排列，过滤掉 score=0 的，取 TOP MAX_DECODE
  const indexed = items.map((it, idx) => ({ item: it, score: scores[idx] }))
  const filtered = indexed.filter(x => x.score > 0).sort((a, b) => b.score - a.score)
  const kept = filtered.slice(0, MAX_DECODE).map(x => x.item)
  const dropped0 = indexed.filter(x => x.score === 0).length
  const droppedLimit = Math.max(0, filtered.length - MAX_DECODE)
  console.log(`  → 标题初筛：${items.length} 条 → 过滤无关 ${dropped0} 条，超上限丢弃 ${droppedLimit} 条 → 待解码 ${kept.length} 条`)
  return kept
}

// ─── 主流程 ────────────────────────────────────────────────────────────────

async function main() {
  const daysBack = parseInt(process.argv[2] ?? '3', 10)
  const d = new Date(Date.now() - daysBack * 86400000)
  const afterDate = d.toISOString().slice(0, 10)
  console.log(`采集 after:${afterDate} 的 Google News（${QUERIES.length} 个查询）...`)

  const ai = getAIClient()
  if (!ai) console.warn('⚠️ 无 AI Key，将降级入库（无摘要，importance=2）')

  let saved = 0, skipped = 0, fallback = 0, tooOld = 0

  // ── Phase A: 拉取所有查询的 RSS ──
  const allItems: RawItem[] = []

  for (const { q, category } of QUERIES) {
    const encoded = encodeURIComponent(`${q} after:${afterDate}`)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`
    console.log(`\n  查询: ${q}`)

    let xml = ''
    for (let attempt = 1; attempt <= 2; attempt++) {
      xml = fetchGNews(url)
      if (xml && !xml.includes('Error 400')) break
      if (attempt < 2) {
        console.log(`    → 第${attempt}次失败，5秒后重试...`)
        await new Promise(r => setTimeout(r, 5000))
      }
    }
    if (!xml || xml.includes('Error 400')) { console.log('    → 2次尝试均失败，跳过此查询'); continue }
    const items = parseFeed(xml, category)
    console.log(`    → ${items.length} 条原始`)
    allItems.push(...items)
  }

  const googleProxyItems = allItems.filter(it => isGoogleNewsProxy(it.url))
  const directItems      = allItems.filter(it => !isGoogleNewsProxy(it.url))
  console.log(`\n  → 共 ${allItems.length} 条原始：${googleProxyItems.length} 条 Google 中间链接，${directItems.length} 条直接 URL`)

  // ── Phase B: 标题 AI 初筛（只筛中间链接，直接 URL 全部保留）──
  const proxyFiltered = await quickFilter(ai, googleProxyItems)

  // ── Phase C: 只对初筛通过的条目解码 URL ──
  let decodedCount = 0, decodeFailCount = 0
  if (proxyFiltered.length > 0) {
    console.log(`  → 解码 ${proxyFiltered.length} 条 URL（5并发）...`)
    const proxyUrls = proxyFiltered.map(it => it.url)
    try {
      const decodeScript = path.join(__dirname, 'decode-gnews-urls.py')
      const tmpInput = path.join(__dirname, '..', 'tmp', '_gnews_decode_input.json')
      const { writeFileSync } = await import('fs')
      writeFileSync(tmpInput, JSON.stringify(proxyUrls))
      const result = execSync(
        `python3 ${decodeScript} < ${tmpInput}`,
        { cwd: __dirname, encoding: 'utf-8', timeout: 300000 }
      )
      const urlMap: Record<string, string | null> = JSON.parse(result.trim())
      for (const item of proxyFiltered) {
        const realUrl = urlMap[item.url]
        if (realUrl) {
          item.url = realUrl
          decodedCount++
        } else {
          decodeFailCount++
        }
      }
    } catch (e: any) {
      console.log(`  ⚠️ 解码脚本异常: ${e.message?.split('\n')[0]}`)
      decodeFailCount += proxyFiltered.length
    }
    console.log(`  → 解码完成：${decodedCount} 成功，${decodeFailCount} 失败（失败条目丢弃，不存死链）`)
  }

  // 合并：直接 URL + 解码成功的 URL
  // 最后再过滤一次，确保没有任何中间链接漏入数据库
  const filteredItems = [
    ...directItems,
    ...proxyFiltered.filter(it => !isGoogleNewsProxy(it.url)),
  ]

  // ── Phase D: 去重 + AI 精判 + 入库 ──
  console.log(`\n  → 共 ${filteredItems.length} 条真实 URL，开始去重...`)
  const candidates: RawItem[] = []
  for (const item of filteredItems) {
    const existsByUrl = await prisma.radarItem.findFirst({ where: { url: item.url }, select: { id: true } })
    if (existsByUrl) { skipped++; continue }
    const existsByTitle = await prisma.radarItem.findFirst({ where: { title: item.title }, select: { id: true } })
    if (existsByTitle) { skipped++; continue }
    if (isTooOld(item.publishedAt, null)) { tooOld++; continue }
    candidates.push({ ...item })
  }
  console.log(`  → 去重后 ${candidates.length} 条候选`)

  if (candidates.length === 0) {
    console.log('  → 0 条新内容')
  } else if (!ai) {
    for (const item of candidates) {
      await prisma.radarItem.create({
        data: { title: item.title, url: item.url, source: item.source, publishedAt: item.publishedAt, category: item.category, importance: 2 },
      })
      fallback++
    }
  } else {
    console.log(`  → AI 判断 ${candidates.length} 条（批量并发）...`)
    const aiInputs = candidates.map(item => ({
      title: item.title,
      content: item.content,
      url: item.url,
      publishedAt: item.publishedAt?.toISOString().slice(0, 10) ?? '未知',
    }))
    const aiResults = await judgeItemsBatch(ai, aiInputs, 2, 10)

    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i]
      const result = aiResults[i]

      if (!result.relevant) { skipped++; continue }
      if (isTooOld(item.publishedAt, result.estimated_date)) { tooOld++; continue }

      let importance = Math.max(1, Math.min(5, result.importance ?? 3))
      if (!result.is_recent && importance > 2) importance = 2

      let finalPublishedAt = item.publishedAt
      if (!finalPublishedAt && result.estimated_date) {
        const d = new Date(result.estimated_date)
        finalPublishedAt = isNaN(d.getTime()) ? null : d
      }

      try {
        await prisma.radarItem.create({
          data: {
            title: item.title, url: item.url, source: item.source,
            publishedAt: finalPublishedAt,
            summary: result.summary ?? null,
            category: result.category ?? item.category,
            city: result.city ?? null,
            importance,
            eventKey: null,
          },
        })
        if (result.fallback) {
          console.log(`    ⚠️ AI降级: ${item.title.slice(0, 40)}`)
          fallback++
        } else {
          console.log(`    ✓ [${result.category}/${importance}★] ${item.title.slice(0, 45)}`)
          saved++
        }
      } catch (e: any) {
        if (e.code === 'P2002') { skipped++; continue }  // URL 唯一约束：已存在，跳过
        throw e
      }
    }
  }

  console.log(`\n完成：saved=${saved}, fallback=${fallback}, skipped=${skipped}, tooOld=${tooOld}`)

  await prisma.radarRun.create({
    data: { source: 'gnews', collected: saved + fallback, skipped, error: null },
  })

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
