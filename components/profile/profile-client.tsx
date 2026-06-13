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
  Heart,
  MessageCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedProgress } from '@/components/ui/animated-progress'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { FollowButton } from '@/components/follow/follow-button'
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
  likeCount: number
  commentCount: number
  images: string[]
}

interface ProgressItem {
  id: string
  content: string
  milestone: string | null
  createdAt: string
  projectId: string
  project: { name: string; slug: string }
}

const VERIFY_TYPE_LABELS: Record<string, string> = {
  IDENTITY: '身份认证', ENTREPRENEUR: '创业者认证', EXPERT: '专家认证', COMMUNITY: '社区认证',
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法阶段', BUILDING: '开发中', LAUNCHED: '已上线', REVENUE: '有收入', PROFITABLE: '已盈利',
}

interface LikedProject {
  id: string
  slug: string
  name: string
  description: string | null
  stage: string
  website: string | null
  contentType: string
  likeCount: number
  commentCount: number
  images: string[]
}

interface LikedPost {
  id: string
  title: string | null
  content: string
  type: string
  likeCount: number
  commentCount: number
  createdAt: string
}

interface ProfileClientProps {
  user: UserProfile
  recentPosts?: RecentPost[]
  projects?: ProjectItem[]
  progressItems?: ProgressItem[]
  followerCount?: number
  followingCount?: number
  isFollowing?: boolean
  likedProjects?: LikedProject[]
  likedPosts?: LikedPost[]
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

export default function ProfileClient({ user, recentPosts = [], projects = [], progressItems = [], followerCount = 0, followingCount = 0, isFollowing = false, likedProjects = [], likedPosts = [] }: ProfileClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [startingChat, setStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'published' | 'liked'>('published')

  const isRecentlyActive = user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime()) < 24 * 60 * 60 * 1000
  const isOwnProfile = (session?.user as any)?.id === user.id
  const displayPosts = recentPosts.filter(p => p.type !== 'PROGRESS').slice(0, 3)

  // Group progress items by project
  const progressByProject = progressItems.reduce<Record<string, ProgressItem[]>>((acc, item) => {
    if (!acc[item.projectId]) acc[item.projectId] = []
    acc[item.projectId].push(item)
    return acc
  }, {})

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
    } catch {}
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
    <div className="min-h-screen bg-surface-soft">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* === Header Card === */}
        <ScrollReveal>
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-hairline">
          <div className="flex items-start gap-5">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || user.username} className="w-20 h-20 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full shrink-0 flex items-center justify-center text-3xl font-bold bg-orange-50 text-primary">
                {user.name?.[0] || user.username[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-ink">{user.name || user.username}</h1>
                {isRecentlyActive && <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />}
                {user.verified && (
                  <Badge variant="default" className="gap-1 bg-blue-500 text-white text-xs">
                    <BadgeCheck className="h-3 w-3" />
                    {user.verifyType ? VERIFY_TYPE_LABELS[user.verifyType] : '已认证'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.location && (
                  <span className="inline-flex items-center gap-1 text-sm text-mute">
                    <MapPin className="h-3.5 w-3.5" />{user.location}
                  </span>
                )}
                {user.mainTrack && <Badge variant="secondary" className="text-xs">{user.mainTrack}</Badge>}
                {user.startupStage && <Badge variant="outline" className="text-xs">{STAGE_LABELS[user.startupStage] || user.startupStage}</Badge>}
              </div>
              {user.lastActiveAt && (
                <div className="flex items-center gap-1 mt-2 text-xs text-ash">
                  <Clock className="h-3 w-3" />最近活跃 {formatRelativeTime(user.lastActiveAt)}
                </div>
              )}
            </div>
          </div>
          {user.bio && <p className="mt-4 text-sm leading-relaxed text-body">{user.bio}</p>}
          <div className="mt-4 flex items-center gap-4">
            <Link href={`/profile/${user.username}/followers`} className="flex items-center gap-1 text-sm text-mute hover:text-primary transition-colors">
              <span className="font-semibold text-ink">{followerCount}</span>粉丝
            </Link>
            <Link href={`/profile/${user.username}/following`} className="flex items-center gap-1 text-sm text-mute hover:text-primary transition-colors">
              <span className="font-semibold text-ink">{followingCount}</span>关注
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-3">
            {!isOwnProfile ? (
              <>
                <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                <Button onClick={handleStartChat} disabled={startingChat} className="gap-2" variant="outline">
                  <Send className="h-4 w-4" />{startingChat ? '正在创建...' : '联系TA'}
                </Button>
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />{copied ? '已复制链接' : '分享'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/settings#profile"><Button variant="outline" className="gap-2"><Settings className="h-4 w-4" />编辑资料</Button></Link>
                <Button variant="outline" onClick={handleShare} className="gap-2"><Share2 className="h-4 w-4" />{copied ? '已复制链接' : '分享'}</Button>
              </>
            )}
          </div>
          {chatError && <p className="text-sm mt-2 text-red-600">{chatError}</p>}
        </div>
        </ScrollReveal>

        {/* === Tab Bar === */}
        <div className="mt-4 flex gap-1 bg-white rounded-2xl p-1 border border-hairline">
          <button
            onClick={() => setActiveTab('published')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'published'
                ? 'bg-primary text-white'
                : 'text-mute hover:text-ink'
            }`}
          >
            发布
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'liked'
                ? 'bg-primary text-white'
                : 'text-mute hover:text-ink'
            }`}
          >
            喜欢 {likedProjects.length + likedPosts.length > 0 && `(${likedProjects.length + likedPosts.length})`}
          </button>
        </div>

        {activeTab === 'published' && (
          <>
        {/* === Products & Progress Section === */}
        {projects.length > 0 && (
          <ScrollReveal delay={100}>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-ink">
              <Rocket className="h-5 w-5 text-primary" />
              产品与项目
            </h2>
            <div className="space-y-4">
              {projects.map(proj => {
                const projProgress = (progressByProject[proj.id] || []).slice(0, 3)
                return (
                  <div key={proj.id} className="bg-white rounded-2xl border border-hairline overflow-hidden hover:-translate-y-0.5 transition-all duration-200 hover:shadow-md">
                    {/* Product card — clickable */}
                    <Link href={`/projects/${proj.slug}`} className="block p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base text-ink">{proj.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {STAGE_LABELS[proj.stage] || proj.stage}
                            </Badge>
                          </div>
                          {proj.description && (
                            <p className="text-xs text-mute mt-1.5 line-clamp-2">{proj.description}</p>
                          )}
                          {/* Stats row */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-ash">
                            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{proj.likeCount}</span>
                            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{proj.commentCount}</span>
                          </div>
                        </div>
                        {proj.website && (
                          <a
                            href={ensureUrl(proj.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 ml-3 p-2 rounded-xl hover:bg-surface-soft transition-colors text-primary"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </Link>

                    {/* Recent progress for this product */}
                    {projProgress.length > 0 && (
                      <div className="border-t border-hairline-soft px-5 py-3 bg-surface-soft/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="h-3.5 w-3.5 text-mute" />
                          <span className="text-xs font-medium text-mute">最近进展</span>
                        </div>
                        <div className="space-y-2">
                          {projProgress.map(prog => (
                            <div key={prog.id} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-body line-clamp-1">{prog.content}</p>
                                <span className="text-xs text-ash">{formatRelativeTime(prog.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link
                          href={`/projects/${proj.slug}`}
                          className="inline-block mt-2 text-xs text-primary hover:underline"
                        >
                          查看全部进展 →
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          </ScrollReveal>
        )}

        {/* === Recent Posts === */}
        {displayPosts.length > 0 && (
          <ScrollReveal delay={200}>
          <div className="mt-6">
            <h2 className="text-sm font-medium mb-2 text-ash">最近动态</h2>
            <div className="space-y-1">
              {displayPosts.map(post => (
                <Link key={post.id} href={`/plaza/${post.id}`} className="block py-2 px-3 rounded-xl hover:bg-white transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate text-mute">{post.title || post.content.slice(0, 60)}</span>
                    <span className="text-xs shrink-0 ml-3 text-ash">{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </ScrollReveal>
        )}

        {isOwnProfile && completenessPercent < 100 && (
          <div className="mt-6 rounded-2xl p-5 bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-ink">卡片完善度</span>
              </div>
              <span className="text-sm font-semibold text-primary">{completenessPercent}%</span>
            </div>
            <AnimatedProgress value={completenessPercent} className="mb-3" />
            <div className="flex flex-wrap gap-2 mb-3">
              {missingFields.map(f => (
                <span key={f.label} className="text-xs px-2.5 py-1 rounded-full bg-white border border-orange-200 text-mute">
                  缺少{f.label}
                </span>
              ))}
            </div>
            <Link href="/settings">
              <Button size="sm" variant="outline" className="gap-1"><Settings className="h-3.5 w-3.5" />去完善</Button>
            </Link>
          </div>
        )}
          </>
        )}

        {activeTab === 'liked' && (
          <div className="mt-6 space-y-6">
            {likedProjects.length === 0 && likedPosts.length === 0 ? (
              <div className="text-center py-12 text-ash text-sm">还没有喜欢的内容</div>
            ) : (
              <>
                {likedProjects.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium mb-2 text-ash">喜欢的产品</h2>
                    <div className="space-y-3">
                      {likedProjects.map(proj => (
                        <Link
                          key={proj.id}
                          href={`/projects/${proj.slug}`}
                          className="block bg-white rounded-2xl border border-hairline p-4 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-ink">{proj.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {STAGE_LABELS[proj.stage] || proj.stage}
                                </Badge>
                              </div>
                              {proj.description && (
                                <p className="text-xs text-mute mt-1 line-clamp-2">{proj.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-ash">
                                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{proj.likeCount}</span>
                                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{proj.commentCount}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {likedPosts.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium mb-2 text-ash">喜欢的动态</h2>
                    <div className="space-y-1">
                      {likedPosts.map(post => (
                        <Link
                          key={post.id}
                          href={`/plaza/${post.id}`}
                          className="block py-2 px-3 rounded-xl hover:bg-white transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate text-mute">{post.title || post.content.slice(0, 60)}</span>
                            <div className="flex items-center gap-3 shrink-0 ml-3 text-xs text-ash">
                              <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{post.likeCount}</span>
                              <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
