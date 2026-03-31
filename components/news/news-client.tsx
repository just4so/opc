'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NewsCard } from '@/components/news/news-card'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const categories = [
  { value: '', label: '全部' },
  { value: 'POLICY', label: '政策' },
  { value: 'FUNDING', label: '融资' },
  { value: 'EVENT', label: '活动' },
  { value: 'TOOL', label: '工具' },
  { value: 'CASE', label: '案例' },
  { value: 'TECH', label: '科技' },
  { value: 'STORY', label: '故事' },
]

interface NewsItem {
  id: string
  title: string
  summary: string | null
  content: string | null
  url: string
  source: string
  category: string
  coverImage: string | null
  publishedAt: string
  isOriginal?: boolean
  author?: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function estimateReadingMinutes(content: string | null, summary: string | null): number {
  const text = content || summary || ''
  const charCount = text.length
  const minutes = Math.ceil(charCount / 300)
  return Math.max(1, minutes)
}

function OriginalSection({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
          原创
        </span>
        <h2 className="text-xl font-bold text-secondary">OPC圈原创</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.isOriginal ? `/news/${item.id}` : item.url}
            target={item.isOriginal ? undefined : '_blank'}
            rel={item.isOriginal ? undefined : 'noopener noreferrer'}
            className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group"
          >
            {item.coverImage && (
              <div className="w-full h-40 overflow-hidden bg-gray-100">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  原创
                </span>
                {item.author && (
                  <span className="text-xs text-gray-500">{item.author}</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              {item.summary && (
                <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                  {item.summary.length > 100 ? item.summary.slice(0, 100) + '...' : item.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: zhCN })}</span>
                <span>·</span>
                <span>约 {estimateReadingMinutes(item.content, item.summary)} 分钟阅读</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

interface NewsClientProps {
  initialNews: NewsItem[]
  initialOriginals: NewsItem[]
  initialTotal: number
}

export function NewsClient({ initialNews, initialOriginals, initialTotal }: NewsClientProps) {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [originals, setOriginals] = useState<NewsItem[]>(initialOriginals)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: initialTotal,
    totalPages: Math.ceil(initialTotal / 20),
  })
  const [loading, setLoading] = useState(false)

  // Track if params changed from initial SSR values
  const [initialCategory] = useState(category)
  const [initialPage] = useState(page)

  useEffect(() => {
    // Skip fetch on initial render — we already have SSR data
    if (category === initialCategory && page === initialPage) return

    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    params.set('page', String(page))
    params.set('limit', '20')

    const fetchPromises: Promise<void>[] = [
      fetch(`/api/news?${params}`)
        .then(res => res.json())
        .then(data => {
          setNews(data.data || [])
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
        }),
    ]

    if (page === 1 && !category) {
      fetchPromises.push(
        fetch('/api/news?original=true&limit=3')
          .then(res => res.json())
          .then(data => {
            setOriginals(data.data || [])
          })
      )
    } else {
      setOriginals([])
    }

    Promise.all(fetchPromises)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, page, initialCategory, initialPage])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-4">创业资讯</h1>
        <p className="text-gray-600">
          OPC创业者关注的政策动态、融资信息、赛事活动和科技趋势
        </p>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value ? `/news?category=${cat.value}` : '/news'}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 原创专区 - 仅首页无筛选时展示 */}
      {!loading && page === 1 && !category && originals.length > 0 && (
        <>
          <OriginalSection items={originals} />
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-semibold text-secondary">更多资讯</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      {/* 资讯列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p>暂无相关资讯</p>
          <p className="text-sm mt-2">请稍后再来查看，或尝试其他分类</p>
        </div>
      )}

      {/* 分页 */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/news?${category ? `category=${category}&` : ''}page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              上一页
            </Link>
          )}
          <span className="px-4 py-2 text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          {page < pagination.totalPages && (
            <Link
              href={`/news?${category ? `category=${category}&` : ''}page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              下一页
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
