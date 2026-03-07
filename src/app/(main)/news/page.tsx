'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NewsCard } from '@/components/news/news-card'

const categories = [
  { value: '', label: '全部' },
  { value: 'POLICY', label: '政策' },
  { value: 'FUNDING', label: '融资' },
  { value: 'EVENT', label: '活动' },
  { value: 'TECH', label: '科技' },
  { value: 'STORY', label: '故事' },
]

interface NewsItem {
  id: string
  title: string
  summary: string | null
  url: string
  source: string
  category: string
  coverImage: string | null
  publishedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function NewsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [news, setNews] = useState<NewsItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    params.set('page', String(page))
    params.set('limit', '20')

    fetch(`/api/news?${params}`)
      .then(res => res.json())
      .then(data => {
        setNews(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category, page])

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

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <NewsContent />
    </Suspense>
  )
}
