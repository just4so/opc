import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RecommendedPostCardProps {
  post: {
    id: string
    content: string
    createdAt: string
    author: {
      name: string | null
      username: string
    }
  }
}

export function RecommendedPostCard({ post }: RecommendedPostCardProps) {
  const excerpt = post.content.replace(/[#*`>\n]/g, '').slice(0, 50)

  return (
    <Link href={`/plaza/${post.id}`} className="block py-2 group">
      <p className="text-sm text-ink group-hover:text-primary transition-colors line-clamp-2">
        {excerpt}
      </p>
      <div className="flex items-center gap-2 mt-1 text-xs text-mute">
        <span>{post.author.name || post.author.username}</span>
        <span>·</span>
        <span>
          {formatDistanceToNow(new Date(post.createdAt), {
            locale: zhCN,
            addSuffix: true,
          })}
        </span>
      </div>
    </Link>
  )
}
