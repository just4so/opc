'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, UserPlus, Sparkles } from 'lucide-react'
import { FollowButton } from '@/components/follow/follow-button'

interface RecommendedUser {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  mainTrack: string | null
  location: string | null
}

interface OnboardingRecommendationsProps {
  currentUserId: string
  currentUserTrack: string | null
  currentUserLocation: string | null
}

export function OnboardingRecommendations({
  currentUserId,
  currentUserTrack,
  currentUserLocation,
}: OnboardingRecommendationsProps) {
  const [dismissed, setDismissed] = useState(false)
  const [users, setUsers] = useState<RecommendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followedCount, setFollowedCount] = useState(0)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    if (followedCount >= 1) {
      dismissBanner()
    }
  }, [followedCount])

  const fetchRecommendations = async () => {
    try {
      const params = new URLSearchParams()
      if (currentUserTrack) params.set('track', currentUserTrack)
      if (currentUserLocation) params.set('location', currentUserLocation)
      const res = await fetch(`/api/users/onboarding?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const dismissBanner = async () => {
    setDismissed(true)
    fetch('/api/users/onboarding', { method: 'PATCH' }).catch(() => {})
  }

  if (dismissed || loading) return null

  return (
    <div className="rounded-2xl p-5 mb-6 relative" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
      <button
        onClick={dismissBanner}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-orange-100"
        style={{ color: '#92400E' }}
        aria-label="关闭推荐"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" style={{ color: '#F97316' }} />
        <h3 className="text-base font-semibold" style={{ color: '#1a1a1a' }}>
          发现和你方向相似的创业者
        </h3>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm mb-3" style={{ color: '#62625b' }}>
            成为第一个被推荐的人——完善你的信息
          </p>
          <Link
            href="/settings#card"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#F97316', color: 'white' }}
          >
            <UserPlus className="h-4 w-4" />
            完善信息
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.slice(0, 5).map(user => (
            <div
              key={user.id}
              className="bg-white rounded-xl p-4 flex flex-col gap-2"
              style={{ border: '1px solid #e5e5e0' }}
            >
              <div className="flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f6f6f3' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium" style={{ color: '#91918c' }}>
                        {(user.name || user.username)?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${user.username}`} className="block">
                    <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>
                      {user.name || user.username}
                    </p>
                  </Link>
                  {user.mainTrack && (
                    <p className="text-xs truncate" style={{ color: '#62625b' }}>{user.mainTrack}</p>
                  )}
                </div>
              </div>
              {user.bio && (
                <p className="text-xs line-clamp-2" style={{ color: '#91918c' }}>{user.bio}</p>
              )}
              <div className="mt-auto pt-1">
                <FollowButton
                  targetUserId={user.id}
                  size="sm"
                  className="w-full"
                  onFollowChange={(followed) => {
                    if (followed) setFollowedCount(c => c + 1)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
