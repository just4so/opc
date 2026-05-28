'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle, Plus } from 'lucide-react'
import { MilestoneBadge } from '@/components/plaza/milestone-badge'
import { Button } from '@/components/ui/button'

interface TimelinePost {
  id: string
  title: string | null
  content: string
  contentHtml?: string | null
  milestone: string | null
  likeCount: number
  commentCount: number
  createdAt: string
}

interface ProgressTimelineProps {
  posts: TimelinePost[]
  isOwnProfile?: boolean
}

function getExcerpt(post: TimelinePost): string {
  const raw = post.contentHtml
    ? post.contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : post.content
  return raw.slice(0, 120)
}

export function ProgressTimeline({ posts, isOwnProfile = false }: ProgressTimelineProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-mute text-sm mb-4">还没有进展记录，去记录你的第一个里程碑吧</p>
        {isOwnProfile && (
          <Link href="/plaza/new">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              记录进展
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Vertical timeline line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-hairline-soft" />

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-primary bg-white" />

            <Link href={`/plaza/${post.id}`} className="block group">
              <div className="rounded-xl p-4 hover:bg-surface-soft transition-colors">
                {/* Milestone badge */}
                {post.milestone && (
                  <div className="mb-2">
                    <MilestoneBadge milestoneId={post.milestone} />
                  </div>
                )}

                {/* Title or excerpt */}
                {post.title && (
                  <p className="font-medium text-sm text-ink group-hover:text-primary transition-colors mb-1">
                    {post.title}
                  </p>
                )}
                <p className="text-sm text-charcoal line-clamp-2">
                  {getExcerpt(post)}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-4 mt-2 text-xs text-ash">
                  <span>{format(new Date(post.createdAt), 'yyyy年M月d日', { locale: zhCN })}</span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
