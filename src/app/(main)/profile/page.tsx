'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Settings,
  FileText,
  Briefcase,
  Award,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  username: string
  email: string | null
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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">用户信息加载失败</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary">个人中心</h1>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            </Link>
          </div>
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
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                    {user.name?.[0] || user.username[0]}
                  </div>
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

                <div className="mt-6 space-y-3">
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {user.location}
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
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

            {/* 快捷操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/plaza/new">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      发布动态
                    </Button>
                  </Link>
                  <Link href="/market/new">
                    <Button variant="outline" className="w-full">
                      <Briefcase className="h-4 w-4 mr-2" />
                      发布需求
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
