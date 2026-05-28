import { MILESTONES } from '@/constants/topics'

interface MilestoneBadgeProps {
  milestoneId: string
  size?: 'sm' | 'md'
}

export function MilestoneBadge({ milestoneId, size = 'sm' }: MilestoneBadgeProps) {
  const milestone = MILESTONES.find(m => m.id === milestoneId)
  if (!milestone) return null

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-orange-100 text-orange-700 ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      {milestone.label}
    </span>
  )
}
