/**
 * Google News 采集脚本（独立进程，绕过 Next.js RSC 限制）
 * 用法: npx tsx scripts/collect-gnews.ts [daysBack=3]
 *
 * 5 个内容维度：政策动向 / 社区动态 / 活动赛事 / 实战案例 / 新锐观点
 * AI 判断规则统一使用 lib/aiJudge.ts
 *
 * 更新时间：2026-05-10
 */
import { execSync } from 'child_process'
import * as fs from 'fs'
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
 * 关键词设计原则：
 *   - 必须含 OPC/一人公司/超级个体 上下文，避免泛化跑偏
 *   - 不用「众创空间」（泛化太强），用「OPC社区」精确指向
 */
/**
 * 查询语法：核心词组（OR）+ 场景词组（OR），两组之间 AND
 * 避免多关键词 AND 导致0结果
 * 更新时间：2026-05-13
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

/**
 * 批量解码 Google News URL → 真实文章 URL
 * 使用 googlenewsdecoder Python 包（需要网络，走代理）
 * 失败的保留原始 Google URL
 */
function decodeGoogleNewsUrls(urls: string[]): string[] {
  if (urls.length === 0) return []
  const tmpIn = '/tmp/gnews_urls_in.json'
  const tmpOut = '/tmp/gnews_urls_out.json'
  const tmpScript = '/tmp/gnews_decode.py'

  fs.writeFileSync(tmpIn, JSON.stringify(urls))
  fs.writeFileSync(tmpScript, `
import os, json, sys
os.environ['HTTPS_PROXY'] = '${PROXY}'
os.environ['HTTP_PROXY'] = '${PROXY}'
try:
    from googlenewsdecoder import new_decoderv1
except ImportError:
    with open('${tmpIn}') as f:
        urls = json.load(f)
    with open('${tmpOut}', 'w') as f:
        json.dump(urls, f)
    sys.exit(0)

with open('${tmpIn}') as f:
    urls = json.load(f)

from concurrent.futures import ThreadPoolExecutor, as_completed
def decode_one(u):
    try:
        r = new_decoderv1(u)
        return r.get('decoded_url', u) if r.get('status') else u
    except:
        return u

results = [None] * len(urls)
with ThreadPoolExecutor(max_workers=10) as ex:
    futures = {ex.submit(decode_one, u): i for i, u in enumerate(urls)}
    for f in as_completed(futures):
        results[futures[f]] = f.result()

with open('${tmpOut}', 'w') as f:
    json.dump(results, f)
`)

  try {
    execSync(`python3 ${tmpScript}`, {
      encoding: 'utf-8',
      timeout: 60000,  // 并行后固定 60s，不再按条目数线性计算
      env: { ...process.env, HTTPS_PROXY: PROXY, HTTP_PROXY: PROXY },
    })
    const out = fs.readFileSync(tmpOut, 'utf-8')
    const decoded = JSON.parse(out)
    return Array.isArray(decoded) ? decoded : urls
  } catch (e: any) {
    console.log(`    \u26a0\ufe0f URL \u89e3\u7801\u5931\u8d25\uff0c\u4fdd\u7559 Google \u94fe\u63a5: ${e.message?.split('\n')[0]}`)
    return urls
  }
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

  for (const { q, category } of QUERIES) {
    const encoded = encodeURIComponent(`${q} after:${afterDate}`)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`
    console.log(`\n  查询: ${q}`)

    // 单查询独立超时：失败不影响其他查询
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

    // 批量解码 Google News URL → 真实文章 URL
    const googleUrls = items.map(it => it.url).filter(u => u.includes('news.google.com/rss/articles/'))
    if (googleUrls.length > 0) {
      console.log(`    → 解码 ${googleUrls.length} 个 Google News URL...`)
      const decoded = decodeGoogleNewsUrls(googleUrls)
      let gi = 0
      for (const item of items) {
        if (item.url.includes('news.google.com/rss/articles/')) {
          item.url = decoded[gi++] || item.url
        }
      }
      const successCount = decoded.filter((u, i) => u !== googleUrls[i]).length
      console.log(`    → 解码成功 ${successCount}/${googleUrls.length}`)
      // 解码失败的条目（仍是 Google 中间链接）降权，避免混入候选池
      for (const item of items) {
        if (item.url.includes('news.google.com')) {
          item._decodeFailure = true
        }
      }
    }

    // ── 先做 URL/标题去重 + 时间过滤，收集需要 AI 判断的候选条目 ──
    const candidates: Array<typeof items[0] & { isDecodeFailure: boolean }> = []
    for (const item of items) {
      const existsByUrl = await prisma.radarItem.findFirst({ where: { url: item.url }, select: { id: true } })
      if (existsByUrl) { skipped++; continue }
      const existsByTitle = await prisma.radarItem.findFirst({ where: { title: item.title }, select: { id: true } })
      if (existsByTitle) { skipped++; continue }
      if (isTooOld(item.publishedAt, null)) { tooOld++; continue }
      candidates.push({ ...item, isDecodeFailure: (item as any)._decodeFailure === true })
    }

    if (candidates.length === 0) { console.log(`    → 0 条新内容`); continue }

    if (!ai) {
      // 无 AI：全部降级入库
      for (const item of candidates) {
        await prisma.radarItem.create({
          data: { title: item.title, url: item.url, source: item.source, publishedAt: item.publishedAt, category: item.category, importance: 2 },
        })
        fallback++
      }
      continue
    }

    // ── 批量并发 AI 判断（2条/批，10并发）──
    console.log(`    → AI 判断 ${candidates.length} 条（批量并发）...`)
    const aiInputs = candidates.map(item => ({
      title: item.title,
      content: item.content,
      url: item.url,
      publishedAt: item.publishedAt?.toISOString().slice(0, 10) ?? '未知',
    }))
    const aiResults = await judgeItemsBatch(ai, aiInputs, 2, 10)

    // ── 处理 AI 结果，逐条入库 ──
    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i]
      const result = aiResults[i]

      if (!result.relevant) { skipped++; continue }
      if (isTooOld(item.publishedAt, result.estimated_date)) { tooOld++; continue }

      let importance = Math.max(1, Math.min(5, result.importance ?? 3))
      if (!result.is_recent && importance > 2) importance = 2
      if (item.isDecodeFailure) importance = Math.min(importance, 2)

      let finalPublishedAt = item.publishedAt
      if (!finalPublishedAt && result.estimated_date) {
        const d = new Date(result.estimated_date)
        finalPublishedAt = isNaN(d.getTime()) ? null : d
      }

      await prisma.radarItem.create({
        data: {
          title: item.title, url: item.url, source: item.source,
          publishedAt: finalPublishedAt,
          summary: result.summary ?? null,
          category: result.category ?? item.category,
          city: result.city ?? null,
          importance,
          eventKey: null,  // 入库时不再由 AI 生成，出刊时统一做重复判断
        },
      })

      if (result.fallback) {
        console.log(`    ⚠️ AI降级: ${item.title.slice(0, 40)}`)
        fallback++
      } else {
        console.log(`    ✓ [${result.category}/${importance}★] ${item.title.slice(0, 45)}`)
        saved++
      }
    }
  }

  console.log(`\n完成：saved=${saved}, fallback=${fallback}, skipped=${skipped}, tooOld=${tooOld}`)

  // 写 RadarRun 记录
  await prisma.radarRun.create({
    data: { source: 'gnews', collected: saved + fallback, skipped, error: null },
  })

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
