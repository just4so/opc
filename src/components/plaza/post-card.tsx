import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TOPICS, POST_TYPES } from '@/constants/topics'

interface PostCardProps {
  post: {
    id: string
    content: string
    type: string
    topics: string[]
    images: string[]
    pinned?: boolean
    likeCount: number
    commentCount: number
    createdAt: Date | string
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

export function PostCard({ post }: PostCardProps) {
  const postType = POST_TYPES.find(t => t.id === post.type)
  // 基于 post.id 生成稳定的虚拟浏览数（charCode 求和避免 NaN）
  const hashVal = post.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const viewCount = (hashVal % 180) + 30

  // 去掉 Markdown 语法的纯文本预览
  const preview = post.content
    .replace(/```[\s\S]*?```/g, '')        // 代码块
    .replace(/#{1,6}\s+/g, '')             // 标题
    .replace(/\*\*(.*?)\*\*/g, '$1')       // 加粗
    .replace(/\*(.*?)\*/g, '$1')           // 斜体
    .replace(/`([^`]+)`/g, '$1')           // 行内代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/^[-*>]\s+/gm, '')            // 列表/引用前缀
    .replace(/\n+/g, ' ')                  // 换行转空格
    .trim()
    .slice(0, 120)

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      {post.pinned && (
        <span className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded z-10">
          精华
        </span>
      )}
      <CardContent className="pt-4">
        {/* 作者信息 - 紧凑版 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.author.username}`}>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/20 transition-all">
                {post.author.name?.[0] || post.author.username[0]}
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
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), {
              locale: zhCN,
              addSuffix: true,
            })}
          </span>
        </div>

        {/* 内容 - 最多3行 */}
        <Link href={`/plaza/${post.id}`}>
          <p className="text-gray-700 text-sm line-clamp-3 mb-3 hover:text-gray-900 transition-colors">
            {preview}
          </p>
        </Link>

        {/* 图片 - 最多1张 + 数量角标 */}
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
                <Badge
                  key={topicId}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: topic.color, color: topic.color }}
                >
                  #{topic.name}
                </Badge>
              ) : null
            })}
            {postType && (
              <Badge variant="outline" className="text-xs">{postType.name}</Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 px-4 border-t">
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3">
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
      </CardFooter>
    </Card>
  )
}
