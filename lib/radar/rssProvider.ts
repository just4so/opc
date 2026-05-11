/**
 * RSS 采集 Provider
 *
 * 统一解析 RSS/Atom feed，输出标准 RadarRawItem 格式
 * 支持：直连原生 RSS、本地 RSSHub 路由
 */

import { RSS_SOURCES, type RssSource } from '@/config/rss-sources'

export interface RadarRawItem {
  title: string
  url: string
  source: string       // 来源名称（如 "36氪"）
  sourceUrl: string    // 原始 feed URL
  publishedAt: Date | null
  content: string      // 正文摘要
  tier: 1 | 2 | 3
  baseImportanceBonus: number
  category: RssSource['category']
  guaranteed?: boolean  // true = 100% OPC相关，跳过AI相关性判断，直接入库
}

// 解析 RSS/Atom XML，提取 items
function parseRssFeed(xml: string, source: RssSource): RadarRawItem[] {
  const items: RadarRawItem[] = []

  // 兼容 RSS 2.0 和 Atom
  const isAtom = xml.includes('<feed')

  if (isAtom) {
    // Atom
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const title = extractTag(entry, 'title')
      const link = extractAtomLink(entry)
      const published = extractTag(entry, 'published') || extractTag(entry, 'updated')
      const content =
        extractTag(entry, 'content') ||
        extractTag(entry, 'summary') ||
        ''

      if (title && link) {
        items.push(makeItem(title, link, published, content, source))
      }
    }
  } else {
    // RSS 2.0
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1]
      const title = extractTag(item, 'title')
      const link = extractTag(item, 'link') || extractTag(item, 'guid')
      const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date')
      const content =
        extractTag(item, 'description') ||
        extractTag(item, 'content:encoded') ||
        ''

      if (title && link) {
        items.push(makeItem(title, link, pubDate, content, source))
      }
    }
  }

  return items
}

function makeItem(
  title: string,
  url: string,
  dateStr: string | null,
  content: string,
  source: RssSource
): RadarRawItem {
  return {
    title: stripCdata(title).trim(),
    url: stripCdata(url).trim(),
    source: source.name,
    sourceUrl: source.url,
    publishedAt: dateStr ? parseDateSafe(dateStr) : null,
    content: stripHtml(stripCdata(content)).slice(0, 1000),
    tier: source.tier,
    baseImportanceBonus: source.baseImportanceBonus ?? 0,
    category: source.category,
    guaranteed: source.guaranteed ?? false,
  }
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : null
}

function extractAtomLink(entry: string): string | null {
  // <link href="..."/> 或 <link rel="alternate" href="..."/>
  const m = entry.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i)
  return m ? m[1] : null
}

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDateSafe(str: string): Date | null {
  try {
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

// 抓取单个 feed，超时 10s
async function fetchFeed(source: RssSource, timeoutMs = 10000): Promise<RadarRawItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 OPC-Radar/1.0',
        Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
    })
    clearTimeout(timer)

    if (!res.ok) return []
    const xml = await res.text()

    // 验证是否是有效的 XML feed
    if (!xml.includes('<item>') && !xml.includes('<entry>')) return []

    return parseRssFeed(xml, source)
  } catch {
    clearTimeout(timer)
    return []
  }
}

export interface RssCollectOptions {
  tiers?: (1 | 2 | 3)[]          // 采集哪些 tier，默认全部
  maxPerSource?: number           // 每个源最多取几条，默认 20
  concurrency?: number            // 并发数，默认 5
  minPublishedDays?: number       // 只取最近N天的，默认 7（0=不过滤）
}

export interface RssCollectResult {
  items: RadarRawItem[]
  stats: {
    sourcesAttempted: number
    sourcesSuccess: number
    totalItems: number
  }
}

// 主入口：并发采集多个 feed
export async function collectRssFeeds(
  options: RssCollectOptions = {}
): Promise<RssCollectResult> {
  const {
    tiers = [1, 2, 3],
    maxPerSource = 20,
    concurrency = 5,
    minPublishedDays = 7,
  } = options

  const sources = RSS_SOURCES.filter((s) => tiers.includes(s.tier))
  const cutoff = minPublishedDays > 0
    ? new Date(Date.now() - minPublishedDays * 24 * 60 * 60 * 1000)
    : null

  let sourcesSuccess = 0
  const allItems: RadarRawItem[] = []

  // 分批并发
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency)
    const results = await Promise.allSettled(batch.map((s) => fetchFeed(s)))

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled' && result.value.length > 0) {
        sourcesSuccess++
        let items = result.value

        // 时间过滤
        if (cutoff) {
          items = items.filter(
            (item) => !item.publishedAt || item.publishedAt >= cutoff
          )
        }

        // 限制每源条数
        allItems.push(...items.slice(0, maxPerSource))
      }
    }
  }

  // URL 去重
  const seen = new Set<string>()
  const deduped = allItems.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })

  return {
    items: deduped,
    stats: {
      sourcesAttempted: sources.length,
      sourcesSuccess,
      totalItems: deduped.length,
    },
  }
}

// 仅采集指定 tier，方便按优先级分步调用
export async function collectTier1(): Promise<RadarRawItem[]> {
  const result = await collectRssFeeds({ tiers: [1], minPublishedDays: 3 })
  return result.items
}

export async function collectTier2(): Promise<RadarRawItem[]> {
  const result = await collectRssFeeds({ tiers: [2], minPublishedDays: 7 })
  return result.items
}

export async function collectTier3(keywords: string[]): Promise<RadarRawItem[]> {
  const result = await collectRssFeeds({ tiers: [3], minPublishedDays: 3 })
  // Tier 3 必须关键词过滤
  return result.items.filter((item) => {
    const text = `${item.title} ${item.content}`
    return keywords.some((kw) => text.includes(kw))
  })
}
