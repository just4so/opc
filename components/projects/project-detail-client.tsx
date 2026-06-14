'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ExternalLink, Heart, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ensureUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FollowButton } from '@/components/follow/follow-button'
import { ImageGallery } from '@/components/projects/image-gallery'
import { ProjectProgressTimeline } from '@/components/projects/project-progress-timeline'
import { ProjectCommentSection } from '@/components/projects/project-comment-section'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法',
  BUILDING: '开发中',
  LAUNCHED: '已上线',
  REVENUE: '有收入',
  PROFITABLE: '已盈利',
}

interface ProgressItem {
  id: string
  content: string
  milestone: string | null
  createdAt: string
}

interface ProjectOwner {
  id: string
  username: string
  name: string | null
  avatar: string | null
  verified: boolean
  mainTrack: string | null
}

interface ProjectData {
  id: string
  slug: string
  name: string
  description: string
  logo: string | null
  images: string[]
  techStack: string[]
  stage: string
  mrr: number | null
  isRevenuePublic: boolean
  website: string | null
  likeCount: number
  commentCount: number
  owner: ProjectOwner
  progressList: ProgressItem[]
}

interface ProjectDetailClientProps {
  project: ProjectData
  currentUserId: string | null
  initialIsLiked: boolean
  initialIsFollowingOwner: boolean
}

export function ProjectDetailClient({
  project,
  currentUserId,
  initialIsLiked,
  initialIsFollowingOwner,
}: ProjectDetailClientProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(project.likeCount)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeBouncing, setLikeBouncing] = useState(false)
  const [progressList, setProgressList] = useState(project.progressList)
  const [showProgressDialog, setShowProgressDialog] = useState(false)

  const isOwner = currentUserId === project.owner.id

  const handleLike = async () => {
    if (!currentUserId) {
      window.location.href = '/login'
      return
    }
    setLikeLoading(true)
    setIsLiked(!isLiked)
    setLikeCount((c) => (isLiked ? c - 1 : c + 1))
    if (!isLiked) {
      setLikeBouncing(true)
      setTimeout(() => setLikeBouncing(false), 300)
    }
    try {
      const res = await fetch(`/api/projects/${project.slug}/like`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
      } else {
        setIsLiked(isLiked)
        setLikeCount(likeCount)
      }
    } catch {
      setIsLiked(isLiked)
      setLikeCount(likeCount)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleProgressCreated = (item: ProgressItem) => {
    setProgressList([item, ...progressList])
    setShowProgressDialog(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="bg-canvas border-b border-hairline-soft">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/plaza?tab=products"
            className="inline-flex items-center text-mute hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 60/40 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product header */}
            <div>
              <div className="flex items-start gap-4">
                {project.logo ? (
                  <Image
                    src={project.logo}
                    alt={project.name}
                    width={56}
                    height={56}
                    className="rounded-2xl flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-xl">
                      {project.name[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-ink">{project.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {STAGE_LABELS[project.stage] || project.stage}
                    </Badge>
                    {project.isRevenuePublic && project.mrr != null && (
                      <Badge variant="outline">
                        MRR ¥{project.mrr.toLocaleString()}
                      </Badge>
                    )}
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        isLiked
                          ? 'bg-red-50 text-red-500'
                          : 'bg-surface-card text-mute hover:text-red-500'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''} ${likeBouncing ? 'like-bounce' : ''}`}
                      />
                      {likeCount}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product images */}
            {project.images.length > 0 && (
              <div className="rounded-2xl overflow-hidden">
                <ImageGallery images={project.images} alt={project.name} />
              </div>
            )}

            {/* Description */}
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {project.description}
              </ReactMarkdown>
            </div>

            {/* Tech stack */}
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-1 bg-surface-card text-mute rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Owner card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card">
              <Link
                href={`/profile/${project.owner.username}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {project.owner.avatar ? (
                    <img
                      src={project.owner.avatar}
                      alt={project.owner.name || project.owner.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-medium">
                      {(project.owner.name || project.owner.username)[0]}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">
                      {project.owner.name || project.owner.username}
                    </span>
                    {project.owner.verified && (
                      <Badge variant="secondary" className="text-xs">
                        认证
                      </Badge>
                    )}
                  </div>
                  {project.owner.mainTrack && (
                    <span className="text-xs text-mute">
                      {project.owner.mainTrack}
                    </span>
                  )}
                </div>
              </Link>
              <FollowButton
                targetUserId={project.owner.id}
                initialIsFollowing={initialIsFollowingOwner}
                size="sm"
              />
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-3">
              {project.website && (
                <a
                  href={ensureUrl(project.website ?? '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    访问网站
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </a>
              )}
            </div>

            {/* Progress timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink">进展记录</h2>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowProgressDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    发布新进展
                  </Button>
                )}
              </div>
              <ProjectProgressTimeline
                progressList={progressList}
                projectSlug={project.slug}
                isOwner={isOwner}
                onRecordProgress={() => setShowProgressDialog(true)}
              />
            </div>
          </div>

          {/* Right column - comments */}
          <div
            id="comments"
            className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-2xl border border-hairline-soft p-4">
              <h2 className="text-base font-semibold text-ink mb-4">
                💬 评论 ({project.commentCount})
              </h2>
              <ProjectCommentSection projectSlug={project.slug} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Dialog */}
      <ProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        projectSlug={project.slug}
        onCreated={handleProgressCreated}
      />
    </div>
  )
}

function ProgressDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectSlug: string
  onCreated: (item: ProgressItem) => void
}) {
  const [content, setContent] = useState('')
  const [milestone, setMilestone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('请输入进展内容')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectSlug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          milestone: milestone.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '提交失败')
      }
      const data = await res.json()
      onCreated(data.progress)
      setContent('')
      setMilestone('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>记录进展</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的最新进展..."
              className="w-full px-4 py-3 border border-hairline-soft rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
              rows={4}
            />
          </div>
          <div>
            <input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="例如：第一个付费用户（可选）"
              className="w-full px-4 py-2 border border-hairline-soft rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? '提交中...' : '发布'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
