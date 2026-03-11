import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const categoryLabels: Record<string, string> = {
  POLICY: '政策',
  FUNDING: '融资',
  EVENT: '活动',
  TECH: '科技',
  STORY: '故事',
  TOOL: '工具',
  CASE: '案例',
}

const categoryColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700',
  FUNDING: 'bg-green-100 text-green-700',
  EVENT: 'bg-purple-100 text-purple-700',
  TECH: 'bg-orange-100 text-orange-700',
  STORY: 'bg-pink-100 text-pink-700',
  TOOL: 'bg-cyan-100 text-cyan-700',
  CASE: 'bg-amber-100 text-amber-700',
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function getNews(id: string) {
  return prisma.news.findUnique({ where: { id } })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const news = await getNews(id)
  if (!news) return { title: '资讯未找到' }

  const description = (news.content || news.summary || '').slice(0, 100)

  return {
    title: news.title,
    description,
    openGraph: {
      title: `${news.title} | OPC创业圈`,
      description,
      url: `https://www.opcquan.com/news/${news.id}`,
      siteName: 'OPC创业圈',
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回资讯列表
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={categoryColors[news.category] || 'bg-gray-100 text-gray-700'}>
            {categoryLabels[news.category] || news.category}
          </Badge>
          {news.isOriginal && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              原创
            </span>
          )}
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(publishedAt, { addSuffix: true, locale: zhCN })}
          </span>
          {news.isOriginal && news.author && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">{news.author}</span>
            </>
          )}
          {!news.isOriginal && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">{news.source}</span>
            </>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{news.title}</h1>

        {news.coverImage && (
          <div className="w-full rounded-xl overflow-hidden mb-6 bg-gray-100">
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
            <div className="text-gray-700 leading-relaxed">
              {news.summary}
            </div>
          ) : (
            <p className="text-gray-500">暂无内容</p>
          )}
        </div>
      ) : (
        <div>
          {news.summary && (
            <p className="text-gray-700 leading-relaxed mb-6">{news.summary}</p>
          )}
          {news.url && (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              查看原文
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
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
