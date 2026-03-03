import { NewsCard } from '@/components/news/news-card'
import prisma from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const categories = [
  { value: '', label: '全部' },
  { value: 'POLICY', label: '政策' },
  { value: 'FUNDING', label: '融资' },
  { value: 'EVENT', label: '活动' },
  { value: 'TECH', label: '科技' },
  { value: 'STORY', label: '故事' },
]

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const category = params.category || ''
  const page = parseInt(params.page || '1')
  const limit = 20

  const where = category ? { category: category as any } : {}

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.news.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

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
      {news.length > 0 ? (
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
      {totalPages > 1 && (
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
            {page} / {totalPages}
          </span>
          {page < totalPages && (
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
