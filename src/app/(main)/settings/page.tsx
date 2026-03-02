'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, MapPin, Globe, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  username: string
  name: string | null
  bio: string | null
  location: string | null
  website: string | null
  wechat: string | null
  skills: string[]
  canOffer: string[]
  lookingFor: string[]
}

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [wechat, setWechat] = useState('')
  const [skills, setSkills] = useState('')
  const [canOffer, setCanOffer] = useState('')
  const [lookingFor, setLookingFor] = useState('')

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
        const data: UserProfile = await res.json()
        setName(data.name || '')
        setBio(data.bio || '')
        setLocation(data.location || '')
        setWebsite(data.website || '')
        setWechat(data.wechat || '')
        setSkills(data.skills.join(', '))
        setCanOffer(data.canOffer.join(', '))
        setLookingFor(data.lookingFor.join(', '))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          bio: bio || null,
          location: location || null,
          website: website || null,
          wechat: wechat || null,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          canOffer: canOffer.split(',').map((s) => s.trim()).filter(Boolean),
          lookingFor: lookingFor.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: '保存成功' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || '保存失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/profile"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回个人中心
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-secondary mb-6">账号设置</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`px-4 py-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  昵称
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的昵称"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  个人简介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下你自己..."
                  className="w-full h-24 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  所在城市
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="如：深圳"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Globe className="h-4 w-4 inline mr-1" />
                  个人网站
                </label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-website.com"
                  type="url"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  微信号
                </label>
                <Input
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  placeholder="你的微信号"
                />
              </div>
            </CardContent>
          </Card>

          {/* 技能标签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">技能与需求</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  技能专长
                </label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="用逗号分隔，如：前端开发, AI, 产品设计"
                />
                <p className="text-xs text-gray-500 mt-1">
                  展示你擅长的技能，帮助其他创业者找到你
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  可以提供
                </label>
                <Input
                  value={canOffer}
                  onChange={(e) => setCanOffer(e.target.value)}
                  placeholder="用逗号分隔，如：技术咨询, 产品评审, 投资建议"
                />
                <p className="text-xs text-gray-500 mt-1">
                  你愿意为其他创业者提供的帮助
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  正在寻找
                </label>
                <Input
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="用逗号分隔，如：技术合伙人, 天使投资, 用户反馈"
                />
                <p className="text-xs text-gray-500 mt-1">
                  你目前需要的资源或帮助
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Link href="/profile">
              <Button type="button" variant="outline">
                取消
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
