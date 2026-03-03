import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface NewsCardProps {
  news: {
    id: string
    title: string
    summary: string | null
    url: string
    source: string
    category: string
    coverImage: string | null
    publishedAt: Date | string
  }
}

const categoryLabels: Record<string, string> = {
  POLICY: '政策',
  FUNDING: '融资',
  EVENT: '活动',
  TECH: '科技',
  STORY: '故事',
}

const categoryColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700',
  FUNDING: 'bg-green-100 text-green-700',
  EVENT: 'bg-purple-100 text-purple-700',
  TECH: 'bg-orange-100 text-orange-700',
  STORY: 'bg-pink-100 text-pink-700',
}

export function NewsCard({ news }: NewsCardProps) {
  const publishedAt = new Date(news.publishedAt)

  return (
    <Link
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100"
    >
      <div className="flex gap-4">
        {news.coverImage && (
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={news.coverImage}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={categoryColors[news.category] || 'bg-gray-100 text-gray-700'}>
              {categoryLabels[news.category] || news.category}
            </Badge>
            <span className="text-xs text-gray-500">{news.source}</span>
          </div>
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
            {news.title}
          </h3>
          {news.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
              {news.summary}
            </p>
          )}
          <div className="text-xs text-gray-400">
            {formatDistanceToNow(publishedAt, { addSuffix: true, locale: zhCN })}
          </div>
        </div>
      </div>
    </Link>
  )
}

// 紧凑版卡片，用于首页展示
export function NewsCardCompact({ news }: NewsCardProps) {
  const publishedAt = new Date(news.publishedAt)

  return (
    <Link
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-3">
        <Badge className={`${categoryColors[news.category] || 'bg-gray-100 text-gray-700'} text-xs`}>
          {categoryLabels[news.category] || news.category}
        </Badge>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
            {news.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{news.source}</span>
            <span>·</span>
            <span>{formatDistanceToNow(publishedAt, { addSuffix: true, locale: zhCN })}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
