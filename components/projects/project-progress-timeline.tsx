'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface ProgressItem {
  id: string
  content: string
  milestone: string | null
  createdAt: string
}

interface ProjectProgressTimelineProps {
  progressList: ProgressItem[]
  projectSlug: string
  isOwner: boolean
}

export function ProjectProgressTimeline({
  progressList,
  projectSlug,
  isOwner,
}: ProjectProgressTimelineProps) {
  if (progressList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-mute">
          {isOwner ? '记录你的第一个里程碑吧' : '暂无进展记录'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-hairline-soft" />

      <div className="space-y-6">
        {progressList.map((item) => (
          <div key={item.id} className="relative">
            {/* Dot */}
            <div className="absolute -left-6 top-2 w-[18px] h-[18px] rounded-full border-2 border-primary bg-canvas" />

            <div className="p-4 rounded-2xl bg-surface-card">
              {/* Date + milestone */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-mute">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    locale: zhCN,
                    addSuffix: true,
                  })}
                </span>
                {item.milestone && (
                  <Badge variant="default" className="text-xs">
                    {item.milestone}
                  </Badge>
                )}
              </div>

              {/* Content */}
              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
