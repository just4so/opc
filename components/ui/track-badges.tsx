import { resolveTrackLabel } from '@/lib/labels'

interface TrackBadgesProps {
  tracks: string[]
  maxVisible?: number
  className?: string
}

/**
 * 展示 mainTracks 标签 pill
 * - 预设 value → 显示 label（如 ai_saas → "AI 产品 / SaaS"）
 * - 自定义文本 → 原样显示
 * - 超出 maxVisible 显示 +N
 */
export function TrackBadges({ tracks, maxVisible = 2, className = '' }: TrackBadgesProps) {
  if (!tracks || tracks.length === 0) return null

  const visible = tracks.slice(0, maxVisible)
  const rest = tracks.length - maxVisible

  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {visible.map((t) => (
        <span
          key={t}
          className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-xs"
        >
          {resolveTrackLabel(t)}
        </span>
      ))}
      {rest > 0 && (
        <span className="bg-surface-soft text-ash px-1.5 py-0.5 rounded text-xs">
          +{rest}
        </span>
      )}
    </span>
  )
}
