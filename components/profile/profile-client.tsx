'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Send,
  BadgeCheck,
  ExternalLink,
  Settings,
  AlertCircle,
  Share2,
  Rocket,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedProgress } from '@/components/ui/animated-progress'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { FollowButton } from '@/components/follow/follow-button'
import { ProgressTimeline } from '@/components/plaza/progress-timeline'
import { ensureUrl } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  level: number
  verified: boolean
  verifyType: string | null
  mainTrack: string | null
  startupStage: string | null
  showInPlaza: boolean
  createdAt: string
  lastActiveAt: string | null
  _count: {
    posts: number
  }
}

interface RecentPost {
  id: string
  title: string | null
  content: string
  type: string
  likeCount: number
  commentCount: number
  createdAt: string
}

interface ProjectItem {
  id: string
  slug: string
  name: string
  description: string | null
  stage: string
  website: string | null
  contentType: string
}

interface ProgressPost {
  id: string
  title: string | null
  content: string
  contentHtml?: string | null
  milestone: string | null
  likeCount: number
  commentCount: number
  createdAt: string
}

const VERIFY_TYPE_LABELS: Record<string, string> = {
  IDENTITY: '身份认证', ENTREPRENEUR: '创业者认证', EXPERT: '专家认证', COMMUNITY: '社区认证',
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法阶段', BUILDING: '开发中', LAUNCHED: '已上线', REVENUE: '有收入', PROFITABLE: '已盈利',
}

interface ProfileClientProps {
  user: UserProfile
  recentPosts?: RecentPost[]
  projects?: ProjectItem[]
  progressPosts?: ProgressPost[]
  followerCount?: number
  followingCount?: number
  isFollowing?: boolean
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`

  return `${Math.floor(days / 365)}年前`
}

export default function ProfileClient({ user, recentPosts = [], projects = [], progressPosts = [], followerCount = 0, followingCount = 0, isFollowing = false }: ProfileClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [startingChat, setStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview')

  const isRecentlyActive = user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime()) < 24 * 60 * 60 * 1000

  const isOwnProfile = (session?.user as any)?.id === user.id
  const displayPosts = recentPosts.slice(0, 3)

  const handleStartChat = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/profile/${user.username}`)
      return
    }

    setStartingChat(true)
    setChatError(null)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/messages/${data.conversation.id}`)
      } else {
        setChatError(data.error || '创建对话失败，请重试')
      }
    } catch {
      setChatError('网络错误，请重试')
    } finally {
      setStartingChat(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user.username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  const completenessFields = [
    { label: '个人简介', filled: !!user.bio },
    { label: '创业方向', filled: !!user.mainTrack },
    { label: '创业阶段', filled: !!user.startupStage },
    { label: '所在城市', filled: !!user.location },
    { label: '产品/项目', filled: projects.length > 0 },
  ]
  const completedCount = completenessFields.filter(f => f.filled).length
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100)
  const missingFields = completenessFields.filter(f => !f.filled)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fbfbf9' }}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* === Section 1: Header === */}
        <ScrollReveal>
        <div className="bg-white rounded-2xl p-6 md:p-8" style={{ border: '1px solid #dadad3' }}>
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username}
                className="w-20 h-20 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full shrink-0 flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: '#FFF7ED', color: '#F97316' }}>
                {user.name?.[0] || user.username[0]}
              </div>
            )}

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: '#000' }}>
                  {user.name || user.username}
                </h1>
                {isRecentlyActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                )}
                {user.verified && (
                  <Badge variant="default" className="gap-1 bg-blue-500 text-white text-xs">
                    <BadgeCheck className="h-3 w-3" />
                    {user.verifyType ? VERIFY_TYPE_LABELS[user.verifyType] : '已认证'}
                  </Badge>
                )}
              </div>

              {/* Tags row: city + direction + stage */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.location && (
                  <span className="inline-flex items-center gap-1 text-sm" style={{ color: '#62625b' }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {user.location}
                  </span>
                )}
                {user.mainTrack && (
                  <Badge variant="secondary" className="text-xs">{user.mainTrack}</Badge>
                )}
                {user.startupStage && (
                  <Badge variant="outline" className="text-xs">{STAGE_LABELS[user.startupStage] || user.startupStage}</Badge>
                )}
              </div>

              {/* Last active */}
              {user.lastActiveAt && (
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#91918c' }}>
                  <Clock className="h-3 w-3" />
                  最近活跃 {formatRelativeTime(user.lastActiveAt)}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#33332e' }}>
              {user.bio}
            </p>
          )}

          {/* Follower/Following counts */}
          <div className="mt-4 flex items-center gap-4">
            <Link
              href={`/profile/${user.username}/followers`}
              className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
              style={{ color: '#62625b' }}
            >
              <span className="font-semibold" style={{ color: '#000' }}>{followerCount}</span>
              粉丝
            </Link>
            <Link
              href={`/profile/${user.username}/following`}
              className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
              style={{ color: '#62625b' }}
            >
              <span className="font-semibold" style={{ color: '#000' }}>{followingCount}</span>
              关注
            </Link>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center gap-3">
            {!isOwnProfile ? (
              <>
                <FollowButton
                  targetUserId={user.id}
                  initialIsFollowing={isFollowing}
                />
                <Button onClick={handleStartChat} disabled={startingChat} className="gap-2 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-shadow" variant="outline">
                  <Send className="h-4 w-4" />
                  {startingChat ? '正在创建...' : '联系TA'}
                </Button>
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  {copied ? '已复制链接' : '分享'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/settings#profile">
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    编辑资料
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  {copied ? '已复制链接' : '分享'}
                </Button>
              </>
            )}
          </div>
          {chatError && (
            <p className="text-sm mt-2" style={{ color: '#9e0a0a' }}>{chatError}</p>
          )}
        </div>
        </ScrollReveal>

        {/* === Tab Navigation === */}
        <div className="mt-6 flex gap-1 border-b" style={{ borderColor: '#dadad3' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'overview'
                ? 'text-primary'
                : 'text-mute hover:text-ink'
            }`}
          >
            概览
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'progress'
                ? 'text-primary'
                : 'text-mute hover:text-ink'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            进展
            {progressPosts.length > 0 && (
              <span className="text-xs text-ash">({progressPosts.length})</span>
            )}
            {activeTab === 'progress' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* === Tab Content === */}
        {activeTab === 'progress' ? (
          <div className="mt-6">
            {isOwnProfile && progressPosts.length > 0 && (
              <div className="mb-4 flex justify-end">
                <Link href="/plaza/new?type=PROGRESS">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    记录一下？
                  </Button>
                </Link>
              </div>
            )}
            <ProgressTimeline posts={progressPosts} isOwnProfile={isOwnProfile} />
          </div>
        ) : (
        <>
        {/* === Section 2: Products === */}
        {projects.length > 0 && (
          <ScrollReveal delay={100}>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#000' }}>
              <Rocket className="h-5 w-5" style={{ color: '#F97316' }} />
              产品与项目
            </h2>
            <div className="space-y-3">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl p-5 transition-colors hover:shadow-sm"
                  style={{ border: '1px solid #dadad3' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base" style={{ color: '#000' }}>{proj.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {STAGE_LABELS[proj.stage] || proj.stage}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1" style={{ color: '#62625b' }}>{proj.description}</p>
                    </div>
                    {proj.website && (
                      <a
                        href={ensureUrl(proj.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 ml-3 p-2 rounded-lg hover:bg-surface-soft transition-colors"
                        style={{ color: '#F97316' }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ScrollReveal>
        )}

        {/* === Section 3: Recent posts (de-emphasized) === */}
        {displayPosts.length > 0 && (
          <ScrollReveal delay={200}>
          <div className="mt-6">
            <h2 className="text-sm font-medium mb-2" style={{ color: '#91918c' }}>
              最近动态
            </h2>
            <div className="space-y-1">
              {displayPosts.map(post => (
                <Link
                  key={post.id}
                  href={`/plaza/${post.id}`}
                  className="block py-2 px-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate" style={{ color: '#62625b' }}>
                      {post.title || post.content.slice(0, 60)}
                    </span>
                    <span className="text-xs shrink-0 ml-3" style={{ color: '#c8c8c1' }}>
                      {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </ScrollReveal>
        )}

        {/* === Section 4: Completeness (own profile only) === */}
        {isOwnProfile && completenessPercent < 100 && (
          <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FDDCB5' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" style={{ color: '#F97316' }} />
                <span className="text-sm font-medium" style={{ color: '#000' }}>卡片完善度</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#F97316' }}>{completenessPercent}%</span>
            </div>
            <AnimatedProgress value={completenessPercent} className="mb-3" />
            <div className="flex flex-wrap gap-2 mb-3">
              {missingFields.map(f => (
                <span
                  key={f.label}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#fff', border: '1px solid #FDDCB5', color: '#62625b' }}
                >
                  缺少{f.label}
                </span>
              ))}
            </div>
            <Link href="/settings">
              <Button size="sm" variant="outline" className="gap-1">
                <Settings className="h-3.5 w-3.5" />
                去完善
              </Button>
            </Link>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
