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
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') })

import { getAIClient, judgeItem, isTooOld } from '../lib/radar/aiJudge'

const prisma = new PrismaClient()

const PROXY = process.env.HTTP_PROXY || 'http://127.0.0.1:7898'

/**
 * 8 个查询，覆盖 5 个内容维度
 * 关键词设计原则：
 *   - 必须含 OPC/一人公司/超级个体 上下文，避免泛化跑偏
 *   - 不用「众创空间」（泛化太强），用「OPC社区」精确指向
 */
const QUERIES = [
  // 政策动向（2条）
  { q: 'OPC 一人公司 政策 补贴 2026', category: 'policy' },
  { q: '超级个体 OPC社区 一人公司 扶持 新政 落地', category: 'policy' },
  // 社区动态（1条）
  { q: 'OPC 一人公司 OPC社区 超级个体 开业 入驻 落地', category: 'community' },
  // 活动赛事（1条）
  { q: 'OPC 一人公司 超级个体 峰会 沙龙 路演 大赛', category: 'event' },
  // 实战案例（2条）
  { q: 'OPC 一人公司 创业者 月入 盈利 收入 故事', category: 'content' },
  { q: '独立开发者 超级个体 一人公司 产品 收入 2026', category: 'content' },
  // 新锐观点（2条）
  { q: 'OPC 一人公司 趋势 报告 研究 分析 洞察', category: 'opinion' },
  { q: '超级个体 独立创业 一人公司 未来 数据 白皮书', category: 'opinion' },
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
  const fs = require('fs')
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
results = []
for u in urls:
    try:
        r = new_decoderv1(u)
        results.append(r.get('decoded_url', u) if r.get('status') else u)
    except:
        results.append(u)
with open('${tmpOut}', 'w') as f:
    json.dump(results, f)
`)

  try {
    execSync(`python3 ${tmpScript}`, {
      encoding: 'utf-8',
      timeout: urls.length * 8000 + 10000,
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
    const xml = fetchGNews(url)
    if (!xml || xml.includes('Error 400')) { console.log('    → 无结果'); continue }
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
    }

    for (const item of items) {
      // URL 去重
      const existsByUrl = await prisma.radarItem.findFirst({ where: { url: item.url }, select: { id: true } })
      if (existsByUrl) { skipped++; continue }
      // 标题去重
      const existsByTitle = await prisma.radarItem.findFirst({ where: { title: item.title }, select: { id: true } })
      if (existsByTitle) { skipped++; continue }

      // 时间硬过滤：超过 30 天的旧文直接丢弃
      if (isTooOld(item.publishedAt, null)) {
        tooOld++; continue
      }

      if (!ai) {
        // 无 AI：降级入库
        await prisma.radarItem.create({
          data: { title: item.title, url: item.url, source: item.source, publishedAt: item.publishedAt, category: item.category, importance: 2 },
        })
        fallback++; continue
      }

      // AI 判断
      const result = await judgeItem(ai, {
        title: item.title,
        content: item.content,
        url: item.url,
        publishedAt: item.publishedAt?.toISOString().slice(0, 10) ?? '未知',
      })

      if (!result.relevant) { skipped++; continue }

      // AI 成功但返回了 estimated_date，再做一次时间过滤
      if (isTooOld(item.publishedAt, result.estimated_date)) {
        tooOld++; continue
      }

      let importance = Math.max(1, Math.min(5, result.importance ?? 3))
      if (!result.is_recent && importance > 2) importance = 2

      // 解析最终发布时间
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
          eventKey: result.event_key ?? null,
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
