export const revalidate = 3600 // 资讯详情 1 小时 ISR（内容变化极低频）
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

const categoryLabels: Record<string, string> = {
  POLICY: '政策',
  FUNDING: '融资',
  EVENT: '活动',
  TECH: '科技',
  STORY: '故事',
  TOOL: '工具',
  CASE: '案例',
  REPORT: '报告',
}

const categoryColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700',
  FUNDING: 'bg-green-100 text-green-700',
  EVENT: 'bg-purple-100 text-purple-700',
  TECH: 'bg-orange-100 text-orange-700',
  STORY: 'bg-pink-100 text-pink-700',
  TOOL: 'bg-cyan-100 text-cyan-700',
  CASE: 'bg-amber-100 text-amber-700',
  REPORT: 'bg-red-100 text-red-700',
}

interface PageProps {
  params: Promise<{ id: string }>
}

const getNews = cache(async (id: string) => {
  return prisma.news.findUnique({ where: { id } })
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const news = await getNews(id)
  if (!news) return { title: '资讯未找到' }

  const description = (news.content || news.summary || '').slice(0, 100)

  return {
    title: news.title,
    description,
    openGraph: {
      title: `${news.title} | OPC圈`,
      description,
      url: `https://www.opcquan.com/news/${news.id}`,
      siteName: 'OPC圈',
      locale: 'zh_CN',
      type: 'article',
    },
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params
  const news = await getNews(id)

  if (!news) notFound()

  const publishedAt = new Date(news.publishedAt)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: news.title,
    description: (news.summary || news.content || '').slice(0, 160),
    datePublished: new Date(news.publishedAt).toISOString(),
    dateModified: new Date(news.publishedAt).toISOString(),
    author: {
      '@type': 'Organization',
      name: 'OPC圈',
      url: 'https://www.opcquan.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OPC圈',
      url: 'https://www.opcquan.com',
    },
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Script
        id="article-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* Back link */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-mute hover:text-primary mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回资讯列表
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={categoryColors[news.category] || 'bg-surface-card text-charcoal'}>
            {categoryLabels[news.category] || news.category}
          </Badge>
          {news.isOriginal && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              原创
            </span>
          )}
          <span className="text-sm text-mute">
            {formatDistanceToNow(publishedAt, { addSuffix: true, locale: zhCN })}
          </span>
          {news.isOriginal && news.author && (
            <>
              <span className="text-stone">·</span>
              <span className="text-sm text-mute">{news.author}</span>
            </>
          )}
          {!news.isOriginal && (
            <>
              <span className="text-stone">·</span>
              <span className="text-sm text-mute">{news.source}</span>
            </>
          )}
        </div>

        <h1 className="text-2xl font-bold text-ink mb-4">{news.title}</h1>

        {news.coverImage && (
          <div className="w-full rounded-xl overflow-hidden mb-6 bg-surface-card">
            <img
              src={news.coverImage}
              alt={news.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {news.isOriginal ? (
        <div className="prose prose-gray max-w-none">
          {news.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {news.content}
            </ReactMarkdown>
          ) : news.summary ? (
            <div className="text-charcoal leading-relaxed">
              {news.summary}
            </div>
          ) : (
            <p className="text-mute">暂无内容</p>
          )}
        </div>
      ) : (
        <div>
          {news.summary && (
            <p className="text-charcoal leading-relaxed mb-6">{news.summary}</p>
          )}
          {news.url && (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-colors font-medium"
            >
              查看原文
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* CTA */}
      <ScrollReveal delay={200}>
      <div className="mt-12 py-8 border-t border-hairline text-center">
        <p className="text-lg font-semibold text-ink mb-2">想入驻 OPC 社区？一键对接</p>
        <p className="text-sm text-mute mb-4">提交意向后，专人帮你对接最合适的社区</p>
        <Link href="/connect" className="inline-block bg-primary text-on-primary font-bold rounded-xl px-8 py-3 hover:bg-primary-600 transition-colors">
          社区直通车 →
        </Link>
      </div>
      </ScrollReveal>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-hairline-soft">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-sm text-mute hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回资讯列表
        </Link>
      </div>
    </div>
  )
}
