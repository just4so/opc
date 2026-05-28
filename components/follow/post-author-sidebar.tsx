'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from '@/components/follow/follow-button'

interface PostAuthorSidebarProps {
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    bio: string | null
    level: number
    verified: boolean
  }
  isFollowing: boolean
}

export function PostAuthorSidebar({ author, isFollowing }: PostAuthorSidebarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4">关于作者</h3>
        <div className="flex items-center space-x-3 mb-4">
          <Link href={`/profile/${author.username}`}>
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-xl hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden">
              {author.avatar ? (
                <img src={author.avatar} alt={author.name || author.username} className="w-full h-full object-cover" />
              ) : (
                <span>{author.name?.[0] || author.username[0]}</span>
              )}
            </div>
          </Link>
          <div>
            <Link
              href={`/profile/${author.username}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {author.name || author.username}
            </Link>
            <div className="text-sm text-mute">
              Lv.{author.level}
            </div>
          </div>
        </div>
        {author.bio && (
          <p className="text-sm text-mute mb-4">{author.bio}</p>
        )}
        <FollowButton
          targetUserId={author.id}
          initialIsFollowing={isFollowing}
          size="sm"
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
