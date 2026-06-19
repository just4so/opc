import Parser from 'rss-parser'
import { PrismaClient, NewsCategory } from '@prisma/client'

const prisma = new PrismaClient()
const parser = new Parser()

// RSS 源配置
const RSS_FEEDS = [
  { url: 'https://36kr.com/feed', source: '36氪', defaultCategory: 'TECH' as NewsCategory },
  { url: 'https://sspai.com/feed', source: '少数派', defaultCategory: 'TECH' as NewsCategory },
]

// 关键词过滤
const KEYWORDS = [
  'OPC', '一人公司', 'AI创业', '创业补贴', '创业大赛', '人工智能',
  '独立开发', 'indie', 'solopreneur', '个人开发者', 'AI工具',
  '创业政策', '科技创新', 'AIGC', 'ChatGPT', '大模型', 'AI',
  '创业者', '创业公司', '初创', 'startup'
]

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

function isRelevant(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase()
  return KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

async function fetchNews() {
  console.log('开始采集资讯...\n')

  let totalAdded = 0
  let totalSkipped = 0

  for (const feed of RSS_FEEDS) {
    console.log(`正在采集: ${feed.source} (${feed.url})`)

    try {
      const parsedFeed = await parser.parseURL(feed.url)
      console.log(`  找到 ${parsedFeed.items?.length || 0} 条内容`)

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
          console.log(`  ✓ ${title.slice(0, 40)}...`)
          totalAdded++
        } catch (err) {
          // URL already exists
        }
      }
    } catch (error) {
      console.error(`  ✗ 采集失败: ${error}`)
    }

    console.log('')
  }

  console.log('采集完成!')
  console.log(`  新增: ${totalAdded}`)
  console.log(`  跳过(不相关): ${totalSkipped}`)
}

fetchNews()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
