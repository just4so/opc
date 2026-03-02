import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
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
    likeCount: number
    commentCount: number
    shareCount: number
    createdAt: Date | string
    author: {
      id: string
      username: string
      name?: string | null
      avatar?: string | null
      level: number
      verified: boolean
    }
  }
}

export function PostCard({ post }: PostCardProps) {
  const postType = POST_TYPES.find(t => t.id === post.type)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* 作者信息 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold">
              {post.author.name?.[0] || post.author.username[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-medium text-secondary hover:text-primary transition-colors"
                >
                  {post.author.name || post.author.username}
                </Link>
                {post.author.verified && (
                  <Badge variant="secondary" className="text-xs">认证</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), {
                  locale: zhCN,
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
          {postType && (
            <Badge variant="outline">{postType.name}</Badge>
          )}
        </div>

        {/* 内容 */}
        <Link href={`/plaza/${post.id}`}>
          <p className="text-gray-700 whitespace-pre-line line-clamp-5 mb-4 hover:text-gray-900 transition-colors">
            {post.content}
          </p>
        </Link>

        {/* 图片 */}
        {post.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {post.images.slice(0, 3).map((image, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* 话题标签 */}
        {post.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex items-center space-x-6 text-gray-500">
          <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
            <Heart className="h-5 w-5" />
            <span className="text-sm">{post.likeCount}</span>
          </button>
          <Link
            href={`/plaza/${post.id}`}
            className="flex items-center space-x-1 hover:text-primary transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{post.commentCount}</span>
          </Link>
          <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
            <Share2 className="h-5 w-5" />
            <span className="text-sm">{post.shareCount}</span>
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}
