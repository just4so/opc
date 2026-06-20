'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { BadgeCheck, MapPin, Package } from 'lucide-react'
import { FollowButton } from '@/components/follow/follow-button'
import { TrackBadges } from '@/components/ui/track-badges'

interface PersonCardProps {
  user: {
    id: string
    name: string | null
    username: string
    avatar?: string | null
    city?: string | null
    mainTrack?: string | null
    mainTracks?: string[] | null
    bio?: string | null
    followerCount: number
    projectCount: number
    projects?: { slug: string; name: string }[]
    isVerified?: boolean
  }
  isFollowing?: boolean
  onFollowChange?: (userId: string, following: boolean) => void
}

export function PersonCard({ user, isFollowing = false, onFollowChange }: PersonCardProps) {
  const { data: session } = useSession()
  const currentUserId = (session?.user as { id?: string })?.id

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Link
      href={`/profile/${user.username}`}
      className="bg-canvas rounded-2xl border border-hairline hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-4 flex flex-col"
    >
      <div className="flex items-start gap-3 mb-2">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || user.username}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {user.name?.[0] || user.username[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink truncate text-base">
              {user.name || user.username}
            </span>
            {user.isVerified && (
              <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-mute flex-wrap">
            <TrackBadges tracks={user.mainTracks?.length ? user.mainTracks : user.mainTrack ? [user.mainTrack] : []} />
            {user.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {user.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {user.bio && (
        <p className="text-xs text-body line-clamp-2 mb-2">{user.bio}</p>
      )}

      {user.projects && user.projects.length > 0 && (
        <Link
          href={`/projects/${user.projects[0].slug}`}
          onClick={handleProjectClick}
          className="flex items-center gap-2 text-xs bg-surface-soft rounded-lg px-2.5 py-2 mb-2 hover:bg-primary/5 transition-colors"
        >
          <Package className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-body truncate">{user.projects[0].name}</span>
        </Link>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-3 text-xs text-mute">
          <span>粉丝 {user.followerCount}</span>
          <span>产品 {user.projectCount}</span>
        </div>
        {currentUserId && currentUserId !== user.id && (
          <div onClick={(e) => e.preventDefault()}>
            <FollowButton
              targetUserId={user.id}
              initialIsFollowing={isFollowing}
              size="sm"
              onFollowChange={(following) => onFollowChange?.(user.id, following)}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
