import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import prisma from '@/lib/db'
import { NewsCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

const parser = new Parser()

// RSS 源配置
const RSS_FEEDS = [
  { url: 'https://36kr.com/feed', source: '36氪', defaultCategory: 'TECH' as NewsCategory },
  { url: 'https://sspai.com/feed', source: '少数派', defaultCategory: 'TECH' as NewsCategory },
]

// 关键词过滤（匹配这些关键词的文章才会被收录）
const KEYWORDS = [
  'OPC', '一人公司', 'AI创业', '创业补贴', '创业大赛', '人工智能',
  '独立开发', 'indie', 'solopreneur', '个人开发者', 'AI工具',
  '创业政策', '科技创新', 'AIGC', 'ChatGPT', '大模型'
]

// 根据内容判断分类
function categorizeNews(title: string, content: string): NewsCategory {
  const text = `${title} ${content}`.toLowerCase()

  if (text.includes('政策') || text.includes('补贴') || text.includes('扶持')) {
    return 'POLICY'
  }
  if (text.includes('融资') || text.includes('投资') || text.includes('基金')) {
    return 'FUNDING'
  }
  if (text.includes('大赛') || text.includes('比赛') || text.includes('活动') || text.includes('峰会')) {
    return 'EVENT'
  }
  if (text.includes('创业故事') || text.includes('访谈') || text.includes('经验分享')) {
    return 'STORY'
  }
  return 'TECH'
}

// 检查是否包含相关关键词
function isRelevant(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase()
  return KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

export async function POST(request: NextRequest) {
  try {
    // 简单的API密钥验证（可选）
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.NEWS_FETCH_API_KEY

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let totalAdded = 0
    let totalSkipped = 0
    const errors: string[] = []

    for (const feed of RSS_FEEDS) {
      try {
        const parsedFeed = await parser.parseURL(feed.url)

        for (const item of parsedFeed.items || []) {
          if (!item.title || !item.link) continue

          const title = item.title
          const content = item.contentSnippet || item.content || ''

          // 关键词过滤
          if (!isRelevant(title, content)) {
            totalSkipped++
            continue
          }

          const category = categorizeNews(title, content)
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()

          try {
            await prisma.news.upsert({
              where: { url: item.link },
              update: {
                title,
                summary: content.slice(0, 500),
                source: feed.source,
                category,
                coverImage: item.enclosure?.url || null,
                publishedAt,
              },
              create: {
                title,
                summary: content.slice(0, 500),
                url: item.link,
                source: feed.source,
                category,
                coverImage: item.enclosure?.url || null,
                publishedAt,
              },
            })
            totalAdded++
          } catch (err) {
            // URL already exists, skip
          }
        }
      } catch (feedError) {
        errors.push(`Failed to fetch ${feed.source}: ${feedError}`)
      }
    }

    return NextResponse.json({
      success: true,
      added: totalAdded,
      skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// GET 方法用于手动触发（方便测试）
export async function GET(request: NextRequest) {
  return POST(request)
}
