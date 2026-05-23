'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Globe,
  MessageSquare,
  Camera,
  Mail,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarPicker } from '@/components/ui/avatar-picker'

interface UserProfile {
  id: string
  username: string
  email: string | null
  emailVerified: boolean
  name: string | null
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  wechat: string | null
  canOffer: string[]
  lookingFor: string[]
  mainTrack: string | null
  startupStage: string | null
  showInPlaza: boolean
}

interface ProjectItem {
  id: string
  name: string
  tagline: string
  stage: string
  website: string | null
  contentType: string
}

const LOOKING_FOR_OPTIONS = [
  '找社区入驻', '找合作伙伴', '找客户', '找投资', '找技术支持', '找曝光机会', '其他',
]

const CAN_OFFER_OPTIONS = [
  '技术开发', '设计', '内容创作', '市场营销', '财务法务', '行业资源', '其他',
]

const STAGE_OPTIONS = [
  { value: 'IDEA', label: '想法阶段' },
  { value: 'BUILDING', label: '开发中' },
  { value: 'LAUNCHED', label: '已上线' },
  { value: 'REVENUE', label: '有收入' },
  { value: 'PROFITABLE', label: '已盈利' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: 'PROJECT', label: '项目' },
  { value: 'DEMAND', label: '需求' },
  { value: 'COOPERATION', label: '合作' },
]

export default function SettingsPage() {
  const { status, update } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Basic fields
  const [avatar, setAvatar] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [nameIsSet, setNameIsSet] = useState(false)
  const [settingName, setSettingName] = useState(false)
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [wechat, setWechat] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [sendingVerify, setSendingVerify] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  // Card fields
  const [mainTrack, setMainTrack] = useState('')
  const [startupStage, setStartupStage] = useState('')
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [canOffer, setCanOffer] = useState<string[]>([])
  const [showInPlaza, setShowInPlaza] = useState(false)

  // Card save state
  const [savingCard, setSavingCard] = useState(false)
  const [cardMessage, setCardMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', tagline: '', stage: 'IDEA', website: '', contentType: 'PROJECT' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchProfile()
      fetchCardData()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data: UserProfile = await res.json()
        setAvatar(data.avatar)
        setUsername(data.username)
        setName(data.name || '')
        setNameIsSet(!!data.name)
        setBio(data.bio || '')
        setLocation(data.location || '')
        setWebsite(data.website || '')
        setWechat(data.wechat || '')
        setUserEmail(data.email)
        setEmailVerified(data.emailVerified)
        setMainTrack(data.mainTrack || '')
        setStartupStage(data.startupStage || '')
        setLookingFor(data.lookingFor || [])
        setCanOffer(data.canOffer || [])
        setShowInPlaza(data.showInPlaza || false)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCardData = async () => {
    try {
      const res = await fetch('/api/user/card')
      if (res.ok) {
        const data = await res.json()
        if (data.projects) setProjects(data.projects)
      }
    } catch {}
  }

  // Basic profile save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: avatar || null,
          bio: bio || null,
          location: location || null,
          website: website || null,
          wechat: wechat || null,
        }),
      })

      if (res.ok) {
        await update({ image: avatar || null })
        setMessage({ type: 'success', text: '保存成功' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || '保存失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' })
    } finally {
      setSaving(false)
    }
  }

  // Card save
  const handleCardSave = async () => {
    setCardMessage(null)
    setSavingCard(true)

    try {
      const res = await fetch('/api/user/card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || null,
          mainTrack: mainTrack || null,
          startupStage: startupStage || null,
          location: location || null,
          lookingFor,
          canOffer,
          wechat: wechat || null,
          showInPlaza,
        }),
      })

      if (res.ok) {
        setCardMessage({ type: 'success', text: '卡片保存成功' })
      } else {
        const data = await res.json()
        setCardMessage({ type: 'error', text: data.error || '保存失败' })
      }
    } catch {
      setCardMessage({ type: 'error', text: '保存失败，请稍后重试' })
    } finally {
      setSavingCard(false)
    }
  }

  const handleSetName = async () => {
    setMessage(null)
    setSettingName(true)
    try {
      const res = await fetch('/api/user/set-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) {
        setNameIsSet(true)
        await update({ name: data.name })
        setMessage({ type: 'success', text: '昵称设置成功' })
      } else {
        setMessage({ type: 'error', text: data.error || '设置失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '设置失败，请稍后重试' })
    } finally {
      setSettingName(false)
    }
  }

  const handleSendVerifyEmail = async () => {
    setSendingVerify(true)
    setVerifyError('')
    try {
      const res = await fetch('/api/auth/send-verify-email', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setVerifySent(true)
      } else {
        setVerifyError(data.error || '发送失败')
      }
    } catch {
      setVerifyError('网络错误，请稍后重试')
    } finally {
      setSendingVerify(false)
    }
  }

  const toggleLookingFor = (val: string) => {
    setLookingFor(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  const toggleCanOffer = (val: string) => {
    setCanOffer(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.tagline.trim()) return
    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(prev => [...prev, data])
        setNewProject({ name: '', tagline: '', stage: 'IDEA', website: '', contentType: 'PROJECT' })
        setShowNewProject(false)
      }
    } catch {}
  }

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/market/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id))
      }
    } catch {}
  }

  // Completeness
  const completenessFields = [
    { label: '头像', filled: !!avatar },
    { label: '个人简介', filled: !!bio },
    { label: '创业方向', filled: !!mainTrack },
    { label: '创业阶段', filled: !!startupStage },
    { label: '所在城市', filled: !!location },
    { label: '正在寻找', filled: lookingFor.length > 0 },
    { label: '可以提供', filled: canOffer.length > 0 },
  ]
  const completedCount = completenessFields.filter(f => f.filled).length
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Camera className="h-5 w-5 mr-2 text-primary" />
                头像
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                >
                  更换头像
                </Button>
              </div>
              {showAvatarPicker && (
                <div className="mt-4">
                  <AvatarPicker
                    currentAvatar={avatar}
                    onSelect={(url) => {
                      setAvatar(url)
                      setShowAvatarPicker(false)
                    }}
                    onClose={() => setShowAvatarPicker(false)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                账户安全
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">邮箱</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {userEmail || '未绑定'}
                    {userEmail && (
                      emailVerified ? (
                        <span className="ml-2 inline-flex items-center text-green-600 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 mr-0.5" />已验证
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center text-orange-500 text-xs">
                          <AlertCircle className="h-3.5 w-3.5 mr-0.5" />未验证
                        </span>
                      )
                    )}
                  </p>
                </div>
                {userEmail && !emailVerified && (
                  <div className="text-right">
                    {verifySent ? (
                      <p className="text-sm text-green-600">已发送，请检查收件箱</p>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendVerifyEmail}
                        disabled={sendingVerify}
                      >
                        {sendingVerify ? '发送中...' : '发送验证邮件'}
                      </Button>
                    )}
                    {verifyError && (
                      <p className="text-xs text-red-500 mt-1">{verifyError}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">昵称</label>
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="你的昵称"
                    disabled={nameIsSet}
                    className={nameIsSet ? 'bg-gray-50 text-gray-500' : ''}
                  />
                  {!nameIsSet && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSetName}
                      disabled={settingName || !name.trim()}
                    >
                      {settingName ? '设置中...' : '设置昵称'}
                    </Button>
                  )}
                </div>
                {nameIsSet && (
                  <p className="text-xs text-gray-400 mt-1">昵称设置后不可修改</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">个人简介</label>
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
              <p className="text-xs text-gray-400 mt-4">用户ID：{username}（系统生成，不可修改）</p>
            </CardContent>
          </Card>

          {/* Submit basic */}
          <div className="flex justify-end space-x-4">
            <Link href="/profile">
              <Button type="button" variant="outline">取消</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存基本信息'}
            </Button>
          </div>
        </form>

        {/* ======== Entrepreneur Card Section ======== */}
        <div className="mt-10 space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-secondary">创业者卡片</h2>
          </div>

          {cardMessage && (
            <div
              className={`px-4 py-3 rounded-md text-sm ${
                cardMessage.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {cardMessage.text}
            </div>
          )}

          {/* Completeness bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">卡片完善度</span>
                <span className="text-sm font-semibold text-primary">{completenessPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                完善卡片信息，让其他创业者更容易找到你
              </p>
            </CardContent>
          </Card>

          {/* showInPlaza toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">在广场展示卡片</p>
                  <p className="text-xs text-gray-500 mt-0.5">开启后，你的卡片将出现在创业者广场</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInPlaza(!showInPlaza)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showInPlaza ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      showInPlaza ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                {showInPlaza ? (
                  <><Eye className="h-3.5 w-3.5" /> 当前：公开展示</>
                ) : (
                  <><EyeOff className="h-3.5 w-3.5" /> 当前：不展示</>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">卡片信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">创业方向（赛道）</label>
                <Input
                  value={mainTrack}
                  onChange={(e) => setMainTrack(e.target.value)}
                  placeholder="如：AI教育、跨境电商、SaaS"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">创业阶段</label>
                <select
                  value={startupStage}
                  onChange={(e) => setStartupStage(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">请选择</option>
                  {STAGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">正在寻找（多选）</label>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLookingFor(opt)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        lookingFor.includes(opt)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">可以提供（多选）</label>
                <div className="flex flex-wrap gap-2">
                  {CAN_OFFER_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleCanOffer(opt)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        canOffer.includes(opt)
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-green-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects CRUD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>关联项目</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewProject(!showNewProject)}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showNewProject && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <Input
                    value={newProject.name}
                    onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="项目名称"
                  />
                  <Input
                    value={newProject.tagline}
                    onChange={e => setNewProject(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="一句话描述"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newProject.stage}
                      onChange={e => setNewProject(prev => ({ ...prev, stage: e.target.value }))}
                      className="px-3 py-2 text-sm border rounded-lg bg-white"
                    >
                      {STAGE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <select
                      value={newProject.contentType}
                      onChange={e => setNewProject(prev => ({ ...prev, contentType: e.target.value }))}
                      className="px-3 py-2 text-sm border rounded-lg bg-white"
                    >
                      {CONTENT_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    value={newProject.website}
                    onChange={e => setNewProject(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="网站 URL（可选）"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleCreateProject} disabled={!newProject.name.trim()}>
                      创建
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewProject(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {projects.length === 0 && !showNewProject && (
                <p className="text-sm text-gray-400 text-center py-4">暂无关联项目</p>
              )}

              {projects.map(proj => (
                <div key={proj.id} className="border rounded-lg p-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-secondary">{proj.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {CONTENT_TYPE_OPTIONS.find(o => o.value === proj.contentType)?.label || proj.contentType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{proj.tagline}</p>
                    {proj.website && (
                      <a href={proj.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3" />{proj.website}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj.id)}
                    className="text-gray-400 hover:text-red-500 shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save card */}
          <div className="flex justify-end">
            <Button onClick={handleCardSave} disabled={savingCard}>
              <Save className="h-4 w-4 mr-2" />
              {savingCard ? '保存中...' : '保存卡片'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
