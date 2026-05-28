'use client'

import Link from 'next/link'
import { FollowButton } from '@/components/follow/follow-button'

interface RecommendedCreatorCardProps {
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    bio: string | null
  }
  isFollowing: boolean
}

export function RecommendedCreatorCard({ user, isFollowing }: RecommendedCreatorCardProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link href={`/profile/${user.username}`} className="shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
          ) : (
            <span>{user.name?.[0] || user.username[0]}</span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${user.username}`}
          className="text-sm font-medium text-ink hover:text-primary transition-colors block truncate"
        >
          {user.name || user.username}
        </Link>
        {user.bio && (
          <p className="text-xs text-mute truncate">{user.bio}</p>
        )}
      </div>
      <FollowButton
        targetUserId={user.id}
        initialIsFollowing={isFollowing}
        size="sm"
      />
    </div>
  )
}
