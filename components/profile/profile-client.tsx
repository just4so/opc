'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  Award,
  MessageSquare,
  Send,
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
  skills: string[]
  canOffer: string[]
  lookingFor: string[]
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

const TYPE_LABELS: Record<string, string> = {
  CHAT: '💬 聊聊', HELP: '❓ 求助', SHARE: '📣 分享', COLLAB: '🤝 找人',
}

interface ProfileClientProps {
  user: UserProfile
  recentPosts?: RecentPost[]
}

export default function ProfileClient({ user, recentPosts = [] }: ProfileClientProps) {
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
        console.error('创建对话失败:', data.error)
      }
    } catch (error) {
      setChatError('网络错误，请重试')
      console.error('创建对话失败:', error)
    } finally {
      setStartingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-secondary">用户主页</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：用户信息卡片 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 基本信息 */}
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
                  <p className="text-gray-500">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Lv.{user.level}</Badge>
                    {user.verified && (
                      <Badge variant="default">
                        <Award className="h-3 w-3 mr-1" />
                        已认证
                      </Badge>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-gray-600 text-center mt-4 text-sm">
                    {user.bio}
                  </p>
                )}

                {/* 发送私信按钮 */}
                {!isOwnProfile && (
                  <div className="mt-6">
                    <Button
                      className="w-full"
                      onClick={handleStartChat}
                      disabled={startingChat}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {startingChat ? '正在创建...' : '发送私信'}
                    </Button>
                    {chatError && (
                      <p className="text-red-500 text-sm mt-2 text-center">{chatError}</p>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <div className="mt-6">
                    <Link href="/profile">
                      <Button variant="outline" className="w-full">
                        查看我的主页
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
                        href={user.website}
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

            {/* 统计数据 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {user._count.posts}
                  </div>
                  <div className="text-sm text-gray-500">动态</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：技能和内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 技能标签 */}
            {user.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    技能专长
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 可以提供 */}
            {user.canOffer.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
                    可以提供
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.canOffer.map((item, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-green-200 text-green-700"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 正在寻找 */}
            {user.lookingFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    正在寻找
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.lookingFor.map((item, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-blue-200 text-blue-700"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 无内容提示 */}
            {user.skills.length === 0 &&
              user.canOffer.length === 0 &&
              user.lookingFor.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    该用户还没有填写详细信息
                  </CardContent>
                </Card>
              )}

            {/* TA的帖子 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">TA的帖子</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">暂无帖子</p>
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
                          <span>❤️ {post.likeCount}</span>
                          <span>💬 {post.commentCount}</span>
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
