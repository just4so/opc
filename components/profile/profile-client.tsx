'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Globe,
  Calendar,
  MessageSquare,
  Send,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  Settings,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  tagline: string
  stage: string
  website: string | null
  contentType: string
}

const TYPE_LABELS: Record<string, string> = {
  CHAT: '聊聊', HELP: '求助', SHARE: '分享', COLLAB: '找人',
}

const VERIFY_TYPE_LABELS: Record<string, string> = {
  IDENTITY: '身份认证', ENTREPRENEUR: '创业者认证', EXPERT: '专家认证', COMMUNITY: '社区认证',
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法阶段', BUILDING: '开发中', LAUNCHED: '已上线', REVENUE: '有收入', PROFITABLE: '已盈利',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  PROJECT: '项目', DEMAND: '需求', COOPERATION: '合作',
}

interface ProfileClientProps {
  user: UserProfile
  recentPosts?: RecentPost[]
  projects?: ProjectItem[]
}

function ensureUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function ProfileClient({ user, recentPosts = [], projects = [] }: ProfileClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [startingChat, setStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const isOwnProfile = (session?.user as any)?.id === user.id

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

  // Completeness calculation for own profile
  const completenessFields = [
    { label: '头像', filled: !!user.avatar },
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-secondary">
            {isOwnProfile ? '我的主页' : '用户主页'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Owner completeness hint */}
        {isOwnProfile && completenessPercent < 100 && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-secondary">卡片完善度</span>
              </div>
              <span className="text-sm font-semibold text-primary">{completenessPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {missingFields.map(f => (
                <span key={f.label} className="text-xs px-2 py-1 rounded-full bg-white border text-gray-500">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: User card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.username}
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                      {user.name?.[0] || user.username[0]}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-secondary">
                    {user.name || user.username}
                  </h2>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                    {user.verified && (
                      <Badge variant="default" className="gap-1 bg-blue-500">
                        <BadgeCheck className="h-3 w-3" />
                        {user.verifyType ? VERIFY_TYPE_LABELS[user.verifyType] : '已认证'}
                      </Badge>
                    )}
                    {user.mainTrack && (
                      <Badge variant="secondary">{user.mainTrack}</Badge>
                    )}
                    {user.startupStage && (
                      <Badge variant="outline">{STAGE_LABELS[user.startupStage] || user.startupStage}</Badge>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-gray-600 text-center mt-4 text-sm">{user.bio}</p>
                )}

                {!isOwnProfile && (
                  <div className="mt-6">
                    <Button
                      className="w-full"
                      onClick={handleStartChat}
                      disabled={startingChat}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {startingChat ? '正在创建...' : '联系TA'}
                    </Button>
                    {chatError && (
                      <p className="text-red-500 text-sm mt-2 text-center">{chatError}</p>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <div className="mt-6 flex gap-2">
                    <Link href="/settings" className="flex-1">
                      <Button variant="outline" className="w-full gap-1">
                        <Settings className="h-4 w-4" />
                        编辑资料
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a
                        href={ensureUrl(user.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')} 加入
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user._count.posts}</div>
                  <div className="text-sm text-gray-500">动态</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Tags, projects, posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects */}
            {projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    关联项目
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.map(proj => (
                      <div key={proj.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-secondary">{proj.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {CONTENT_TYPE_LABELS[proj.contentType] || proj.contentType}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {STAGE_LABELS[proj.stage] || proj.stage}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{proj.tagline}</p>
                          </div>
                          {proj.website && (
                            <a
                              href={ensureUrl(proj.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 ml-2 text-gray-400 hover:text-primary"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent posts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                  最近动态
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">暂无动态</p>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map(post => (
                      <Link key={post.id} href={`/plaza/${post.id}`} className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        {post.title && (
                          <p className="font-medium text-sm text-gray-900 truncate">{post.title}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                          {post.content.slice(0, 100)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {TYPE_LABELS[post.type] || post.type}
                          </span>
                          <span>{post.likeCount} 赞</span>
                          <span>{post.commentCount} 评</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
