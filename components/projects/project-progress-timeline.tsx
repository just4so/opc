'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProgressPost {
  id: string
  content: string
  milestone: string | null
  createdAt: string
  likeCount: number
  commentCount: number
}

interface ProjectProgressTimelineProps {
  posts: ProgressPost[]
  projectId: string
  projectSlug: string
  isOwner: boolean
}

export function ProjectProgressTimeline({
  posts,
  projectId,
  projectSlug,
  isOwner,
}: ProjectProgressTimelineProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-mute mb-4">暂无进展记录</p>
        {isOwner && (
          <Link href={`/plaza/new?type=PROGRESS&projectId=${projectId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              记录你的第一个里程碑
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link href={`/plaza/new?type=PROGRESS&projectId=${projectId}`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              记录进展
            </Button>
          </Link>
        </div>
      )}

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-hairline-soft" />

        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              {/* Dot */}
              <div className="absolute -left-6 top-2 w-[18px] h-[18px] rounded-full border-2 border-primary bg-canvas" />

              <Link
                href={`/plaza/${post.id}`}
                className="block p-4 rounded-xl bg-surface-card hover:bg-surface-soft transition-colors"
              >
                {/* Date + milestone */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-mute">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      locale: zhCN,
                      addSuffix: true,
                    })}
                  </span>
                  {post.milestone && (
                    <Badge variant="default" className="text-xs">
                      {post.milestone}
                    </Badge>
                  )}
                </div>

                {/* Content preview */}
                <p className="text-sm text-charcoal leading-relaxed line-clamp-3">
                  {post.content.slice(0, 200)}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-ash">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.commentCount}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
