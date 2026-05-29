'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, ExternalLink } from 'lucide-react'

interface ProductCardProps {
  project: {
    id: string
    slug: string
    name: string
    description: string | null
    images: string[]
    stage: string
    website?: string | null
    likeCount: number
    commentCount: number
    owner: { id: string; name: string | null; username: string; avatar?: string | null; city?: string | null }
  }
  isLiked?: boolean
  onLikeChange?: (projectId: string, liked: boolean) => void
}

const STAGE_COLORS: Record<string, string> = {
  IDEA: 'bg-surface-card text-mute',
  BUILDING: 'bg-blue-50 text-blue-600',
  LAUNCHED: 'bg-green-50 text-green-600',
  REVENUE: 'bg-orange-50 text-orange-600',
  PROFITABLE: 'bg-emerald-50 text-emerald-700',
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法', BUILDING: '开发中', LAUNCHED: '已上线', REVENUE: '有收入', PROFITABLE: '已盈利',
}

export function ProductCard({ project, isLiked = false, onLikeChange }: ProductCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(project.likeCount)

  const hasImage = project.images.length > 0
  const stageColor = STAGE_COLORS[project.stage] || STAGE_COLORS.IDEA
  const stageLabel = STAGE_LABELS[project.stage] || project.stage

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.user) {
      router.push('/login')
      return
    }
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
    onLikeChange?.(project.id, newLiked)
    try {
      const res = await fetch(`/api/projects/${project.slug}/like`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLiked(data.liked)
      if (data.likeCount !== undefined) setLikeCount(data.likeCount)
    } catch {
      setLiked(!newLiked)
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1)
      onLikeChange?.(project.id, !newLiked)
    }
  }

  const handleWebsite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (project.website) {
      const url = project.website.startsWith('http') ? project.website : `https://${project.website}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${project.owner.username}`)
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="bg-canvas rounded-2xl border border-hairline hover:shadow-md transition-shadow flex flex-col overflow-hidden"
    >
      {hasImage && (
        <div className="aspect-[16/10] overflow-hidden bg-surface-card">
          <img
            src={project.images[0]}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-ink text-sm leading-snug truncate">
            {project.name}
          </h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${stageColor}`}>
            {stageLabel}
          </span>
        </div>

        {project.description && (
          <p className={`text-sm text-body leading-relaxed ${hasImage ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button onClick={handleOwnerClick} className="flex items-center gap-1.5 min-w-0">
            {project.owner.avatar ? (
              <img src={project.owner.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {project.owner.name?.[0] || project.owner.username[0]}
              </div>
            )}
            <span className="text-xs text-body truncate hover:text-primary transition-colors">
              {project.owner.name || project.owner.username}
            </span>
          </button>
          {project.owner.city && (
            <span className="text-xs text-ash">· {project.owner.city}</span>
          )}
          {project.website && (
            <button
              onClick={handleWebsite}
              className="ml-auto flex items-center gap-0.5 text-xs text-ash hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">{getDomain(project.website)}</span>
            </button>
          )}
        </div>

        <div className="border-t border-hairline mt-3 pt-3 flex items-center gap-4 text-xs">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${liked ? 'text-primary' : 'text-mute hover:text-primary'}`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <span className="flex items-center gap-1 text-mute">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{project.commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
