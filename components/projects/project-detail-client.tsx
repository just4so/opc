'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ExternalLink, Star, BookOpen, Clock, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from '@/components/follow/follow-button'
import { ProjectProgressTimeline } from '@/components/projects/project-progress-timeline'
import { ProjectCommentSection } from '@/components/projects/project-comment-section'

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法',
  BUILDING: '开发中',
  LAUNCHED: '已上线',
  REVENUE: '有收入',
  PROFITABLE: '已盈利',
}

interface ProgressPost {
  id: string
  content: string
  milestone: string | null
  createdAt: string
  likeCount: number
  commentCount: number
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
  screenshots: string[]
  techStack: string[]
  stage: string
  mrr: number | null
  isRevenuePublic: boolean
  website: string | null
  commentCount: number
  owner: ProjectOwner
  posts: ProgressPost[]
}

interface ProjectDetailClientProps {
  project: ProjectData
  currentUserId: string | null
  initialIsFavorited: boolean
  initialIsFollowingOwner: boolean
}

type Tab = 'intro' | 'progress' | 'comments'

export function ProjectDetailClient({
  project,
  currentUserId,
  initialIsFavorited,
  initialIsFollowingOwner,
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('intro')
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [favLoading, setFavLoading] = useState(false)

  const isOwner = currentUserId === project.owner.id

  const handleFavorite = async () => {
    if (!currentUserId) {
      window.location.href = '/login'
      return
    }
    setFavLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.slug}/favorite`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setIsFavorited(data.favorited)
      }
    } finally {
      setFavLoading(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'intro', label: '介绍', icon: BookOpen },
    { key: 'progress', label: '进展记录', icon: Clock },
    { key: 'comments', label: '评论', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="bg-canvas border-b">
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

      {/* Header */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
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
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-ink truncate">{project.name}</h1>
                <p className="text-mute mt-1">{project.description?.slice(0, 100)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavorite}
                disabled={favLoading}
                className={isFavorited ? 'text-amber-500 border-amber-200' : ''}
              >
                <Star className={`h-4 w-4 mr-1.5 ${isFavorited ? 'fill-amber-500' : ''}`} />
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
              {project.website && (
                <a href={project.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    访问网站
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge variant="outline">{STAGE_LABELS[project.stage] || project.stage}</Badge>
            {project.isRevenuePublic && project.mrr != null && (
              <Badge variant="outline">MRR ¥{project.mrr.toLocaleString()}</Badge>
            )}
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-0.5 bg-surface-card text-mute rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Link
                href={`/profile/${project.owner.username}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {project.owner.avatar ? (
                    <img
                      src={project.owner.avatar}
                      alt={project.owner.name || project.owner.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-primary font-medium">
                      {(project.owner.name || project.owner.username)[0]}
                    </span>
                  )}
                </div>
                <span className="text-sm text-charcoal font-medium">
                  {project.owner.name || project.owner.username}
                </span>
              </Link>
              <FollowButton
                targetUserId={project.owner.id}
                initialIsFollowing={initialIsFollowingOwner}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-primary border-primary'
                    : 'text-mute border-transparent hover:text-ink'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.key === 'progress' && project.posts.length > 0 && (
                  <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">
                    {project.posts.length}
                  </span>
                )}
                {tab.key === 'comments' && project.commentCount > 0 && (
                  <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">
                    {project.commentCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl">
          {activeTab === 'intro' && (
            <IntroTab
              description={project.description}
              screenshots={project.screenshots}
              owner={project.owner}
              initialIsFollowingOwner={initialIsFollowingOwner}
            />
          )}
          {activeTab === 'progress' && (
            <ProjectProgressTimeline
              posts={project.posts}
              projectId={project.id}
              projectSlug={project.slug}
              isOwner={isOwner}
            />
          )}
          {activeTab === 'comments' && (
            <ProjectCommentSection
              projectSlug={project.slug}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function IntroTab({
  description,
  screenshots,
  owner,
  initialIsFollowingOwner,
}: {
  description: string
  screenshots: string[]
  owner: ProjectOwner
  initialIsFollowingOwner: boolean
}) {
  return (
    <div className="space-y-8">
      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {description}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-ink mb-4">产品截图</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {screenshots.map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-surface-card">
                  <img
                    src={src}
                    alt={`截图 ${i + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/profile/${owner.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name || owner.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-medium">
                    {(owner.name || owner.username)[0]}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">
                    {owner.name || owner.username}
                  </span>
                  {owner.verified && (
                    <Badge variant="secondary" className="text-xs">认证</Badge>
                  )}
                </div>
                {owner.mainTrack && (
                  <span className="text-xs text-mute">{owner.mainTrack}</span>
                )}
              </div>
            </Link>
            <FollowButton
              targetUserId={owner.id}
              initialIsFollowing={initialIsFollowingOwner}
              size="sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
