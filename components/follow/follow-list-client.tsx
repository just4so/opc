'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BadgeCheck, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FollowButton } from '@/components/follow/follow-button'
import { TrackBadges } from '@/components/ui/track-badges'

interface UserItem {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  mainTracks: string[]
  verified: boolean
  followedAt: string
}

interface FollowListClientProps {
  userId: string
  username: string
  type: 'followers' | 'following'
}

export function FollowListClient({ userId, username, type }: FollowListClientProps) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData(1)
  }, [userId, type])

  const fetchData = async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/follow/${userId}/${type}?page=${p}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
        setPage(data.page)
      }
    } finally {
      setLoading(false)
    }
  }

  const title = type === 'followers' ? '粉丝' : '关注'
  const emptyText = type === 'followers' ? '还没有粉丝' : '还没有关注的人'
  const emptyCta = type === 'followers' ? '完善资料让更多人发现你' : '去广场发现创业者'
  const emptyLink = type === 'followers' ? '/settings' : '/plaza'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fbfbf9' }}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/profile/${username}`}
            className="text-sm hover:text-primary transition-colors"
            style={{ color: '#62625b' }}
          >
            ← 返回主页
          </Link>
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: '#000' }}>
          {title}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#91918c' }}>
          共 {total} 人
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#91918c' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#c8c8c1' }} />
            <p className="text-base font-medium mb-2" style={{ color: '#62625b' }}>
              {emptyText}
            </p>
            <p className="text-sm mb-4" style={{ color: '#91918c' }}>
              {emptyCta}
            </p>
            <Link href={emptyLink}>
              <Button size="sm">
                {type === 'followers' ? '去完善' : '去广场'}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4"
                  style={{ border: '1px solid #dadad3' }}
                >
                  <Link href={`/profile/${user.username}`} className="shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: '#FFF7ED', color: '#F97316' }}
                      >
                        {user.name?.[0] || user.username[0]}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-semibold text-sm hover:text-primary transition-colors truncate"
                        style={{ color: '#000' }}
                      >
                        {user.name || user.username}
                      </Link>
                      {user.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: '#3B82F6' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TrackBadges tracks={user.mainTracks ?? []} />
                      {user.bio && (
                        <span className="text-xs truncate" style={{ color: '#91918c' }}>
                          {user.bio}
                        </span>
                      )}
                    </div>
                  </div>

                  <FollowButton
                    targetUserId={user.id}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchData(page - 1)}
                >
                  上一页
                </Button>
                <span className="flex items-center text-sm px-3" style={{ color: '#62625b' }}>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchData(page + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
