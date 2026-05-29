'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing?: boolean
  size?: 'default' | 'sm'
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  size = 'default',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  const currentUserId = (session?.user as { id?: string })?.id

  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  const handleToggle = () => {
    const prev = isFollowing
    setIsFollowing(!prev)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/follow/${targetUserId}`, {
          method: prev ? 'DELETE' : 'POST',
        })
        if (!res.ok) {
          setIsFollowing(prev)
        } else {
          onFollowChange?.(!prev)
        }
      } catch {
        setIsFollowing(prev)
      }
    })
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className={`active:scale-95 transition-transform ${className || ''}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1.5" />
          已关注
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" />
          关注
        </>
      )}
    </Button>
  )
}
