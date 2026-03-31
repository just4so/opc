import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TOPICS } from '@/constants/topics'

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  CHAT:  { label: '💬 聊聊',  className: 'bg-gray-100 text-gray-600' },
  HELP:  { label: '❓ 求助',  className: 'bg-orange-100 text-orange-600' },
  SHARE: { label: '📣 分享',  className: 'bg-green-100 text-green-700' },
  COLLAB:{ label: '🤝 找人',  className: 'bg-blue-100 text-blue-700' },
}

interface PostCardProps {
  post: {
    id: string
    content: string
    contentHtml?: string | null
    title?: string | null
    type: string
    topics: string[]
    images: string[]
    pinned?: boolean
    likeCount: number
    commentCount: number
    createdAt: Date | string
    budgetMin?: number | null
    budgetMax?: number | null
    budgetType?: string | null
    deadline?: Date | string | null
    author: {
      id: string
      username: string
      name?: string | null
      avatar?: string | null
      level: number
      verified: boolean
      location?: string | null
      mainTrack?: string | null
      startupStage?: string | null
    }
  }
}

function getPreview(post: PostCardProps['post']): string {
  const raw = post.contentHtml
    ? post.contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : post.content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*>]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
  return raw.slice(0, 100)
}

function getBudgetLabel(post: PostCardProps['post']): string | null {
  if (post.type !== 'COLLAB') return null
  if (post.budgetType === 'NEGOTIABLE') return '预算：面议'
  if (post.budgetType === 'FIXED' && post.budgetMin != null) return `预算：固定 ${post.budgetMin} 元`
  if (post.budgetType === 'RANGE' && post.budgetMin != null && post.budgetMax != null)
    return `预算：${post.budgetMin}–${post.budgetMax} 元`
  return null
}

export function PostCard({ post }: PostCardProps) {
  const typeConfig = TYPE_CONFIG[post.type]
  const hashVal = post.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const viewCount = (hashVal % 180) + 30
  const preview = getPreview(post)
  const budgetLabel = getBudgetLabel(post)

  return (
    <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow relative">
      {post.pinned && (
        <span className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded z-10">
          精华
        </span>
      )}
      <CardContent className="pt-4">
        {/* 作者信息 */}
        <div className="flex items-center gap-2 mb-3">
          <Link href={`/profile/${post.author.username}`}>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name || post.author.username} className="w-full h-full object-cover" />
              ) : (
                <span>{post.author.name?.[0] || post.author.username[0]}</span>
              )}
            </div>
          </Link>
          <Link
            href={`/profile/${post.author.username}`}
            className="text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            {post.author.name || post.author.username}
          </Link>
          {post.author.verified && (
            <Badge variant="secondary" className="text-xs py-0">认证</Badge>
          )}
          {typeConfig && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig.className}`}>
              {typeConfig.label}
            </span>
          )}
        </div>

        {/* 标题（可选） */}
        {post.title && (
          <Link href={`/plaza/${post.id}`}>
            <p className="font-semibold text-gray-900 text-sm mb-1 hover:text-primary transition-colors">
              {post.title}
            </p>
          </Link>
        )}

        {/* 内容预览 */}
        <Link href={`/plaza/${post.id}`}>
          <p className="text-gray-700 text-[15px] leading-relaxed line-clamp-3 mb-3 hover:text-gray-900 transition-colors">
            {preview}
          </p>
        </Link>

        {/* COLLAB 额外信息 */}
        {post.type === 'COLLAB' && (budgetLabel || post.deadline) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {budgetLabel && (
              <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                {budgetLabel}
              </span>
            )}
            {post.deadline && (
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                截止：{format(new Date(post.deadline), 'yyyy-MM-dd')}
              </span>
            )}
          </div>
        )}

        {/* 图片 */}
        {post.images.length > 0 && (
          <div className="mb-3 relative rounded-lg overflow-hidden h-36 bg-gray-100">
            <img src={post.images[0]} className="w-full h-full object-cover" alt="" />
            {post.images.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                +{post.images.length - 1}
              </span>
            )}
          </div>
        )}

        {/* 话题标签 */}
        {post.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.topics.map((topicId) => {
              const topic = TOPICS.find(t => t.id === topicId)
              return topic ? (
                <span
                  key={topicId}
                  className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full"
                >
                  #{topic.name}
                </span>
              ) : (
                <span key={topicId} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  #{topicId}
                </span>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 px-4 border-t">
        <div className="flex items-center justify-between w-full pt-3">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span>{post.likeCount}</span>
            </button>
            <Link
              href={`/plaza/${post.id}#comments`}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount}</span>
            </Link>
            <span className="flex items-center gap-1 text-gray-400">
              <Eye className="h-4 w-4" />
              <span>{viewCount}</span>
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), { locale: zhCN, addSuffix: true })}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
