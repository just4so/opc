'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle } from 'lucide-react'

interface PostListItemProps {
  post: {
    id: string
    content: string
    type: string
    topics: string[]
    pinned?: boolean
    likeCount: number
    commentCount: number
    createdAt: Date | string
    author: {
      id: string
      username: string
      name?: string | null
      avatar?: string | null
    }
  }
}

const typeColors: Record<string, string> = {
  EXPERIENCE: 'bg-orange-500',
  QUESTION: 'bg-blue-500',
  DAILY: 'bg-green-500',
  DISCUSSION: 'bg-purple-500',
  RESOURCE: 'bg-teal-500',
}

export function PostListItem({ post }: PostListItemProps) {
  const preview = post.content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .slice(0, 40)

  return (
    <Link
      href={`/plaza/${post.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      <div
        className={`w-1 h-10 rounded-full flex-shrink-0 ${typeColors[post.type] ?? 'bg-gray-400'}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {post.pinned && (
            <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded flex-shrink-0">
              精华
            </span>
          )}
          <p className="text-sm text-gray-900 truncate">{preview}</p>
        </div>
        {post.topics.length > 0 && (
          <div className="flex items-center gap-2 mt-0.5">
            {post.topics.slice(0, 2).map((t) => (
              <span key={t} className="text-xs text-gray-400">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
        <span className="hidden sm:inline">
          {post.author.name || post.author.username}
        </span>
        <span className="flex items-center gap-0.5">
          <Heart className="h-3 w-3" />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-0.5">
          <MessageCircle className="h-3 w-3" />
          {post.commentCount}
        </span>
        <span className="hidden sm:inline">
          {formatDistanceToNow(new Date(post.createdAt), {
            locale: zhCN,
            addSuffix: true,
          })}
        </span>
      </div>
    </Link>
  )
}
