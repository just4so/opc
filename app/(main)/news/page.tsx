import { Suspense } from 'react'
import { NewsClient } from '@/components/news/news-client'
import prisma from '@/lib/db'

export const revalidate = 300 // 5分钟缓存，资讯不需要实时

async function NewsPageInner({ searchParams }: { searchParams: { category?: string; page?: string } }) {
  const page = parseInt(searchParams.page || '1')
  const category = searchParams.category || ''
  const limit = 20

  const where: any = {}
  if (category) where.category = category

  const [news, total, originals] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ isOriginal: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, summary: true, category: true,
        source: true, url: true, coverImage: true, author: true,
        isOriginal: true, publishedAt: true, createdAt: true,
        // content 不在列表页传输，详情页单独查
      },
    }),
    prisma.news.count({ where }),
    page === 1 && !category
      ? prisma.news.findMany({
          where: { isOriginal: true },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: {
            id: true, title: true, summary: true, category: true,
            source: true, url: true, coverImage: true, author: true,
            isOriginal: true, publishedAt: true, createdAt: true,
          },
        })
      : Promise.resolve([]),
  ])

  // Serialize dates to strings for client component
  const serializeNews = (items: any[]) =>
    items.map((item) => ({
      ...item,
      publishedAt: item.publishedAt?.toISOString() ?? '',
      createdAt: item.createdAt?.toISOString() ?? '',
      updatedAt: item.updatedAt?.toISOString() ?? '',
    }))

  return (
    <NewsClient
      initialNews={serializeNews(news)}
      initialOriginals={serializeNews(originals)}
      initialTotal={total}
    />
  )
}

export default function NewsPage({ searchParams }: { searchParams: { category?: string; page?: string } }) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    }>
      <NewsPageInner searchParams={searchParams} />
    </Suspense>
  )
}
