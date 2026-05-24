'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
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
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarPicker } from '@/components/ui/avatar-picker'
import { ensureUrl } from '@/lib/utils'

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

type SettingsSection = 'basic' | 'card' | 'projects'

const NAV_ITEMS: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: '基本信息', icon: <User className="h-4 w-4" /> },
  { key: 'card', label: '创业者卡片', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'projects', label: '我的产品', icon: <Rocket className="h-4 w-4" /> },
]

export default function SettingsPage() {
  const { status, update } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SettingsSection>('basic')
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

  // Save state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Card fields
  const [mainTrack, setMainTrack] = useState('')
  const [startupStage, setStartupStage] = useState('')
  const [showInPlaza, setShowInPlaza] = useState(false)
  const [savingCard, setSavingCard] = useState(false)
  const [cardMessage, setCardMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', tagline: '', stage: 'IDEA', website: '', contentType: 'PROJECT' })

  // Hash-based section navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as SettingsSection
    if (['basic', 'card', 'projects'].includes(hash)) {
      setActiveSection(hash)
    }
  }, [])

  const switchSection = (section: SettingsSection) => {
    setActiveSection(section)
    window.history.replaceState(null, '', `#${section}`)
  }

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

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.tagline.trim()) return
    try {
      const res = await fetch('/api/user/projects', {
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
      const res = await fetch(`/api/user/projects/${id}`, { method: 'DELETE' })
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
    { label: '产品/项目', filled: projects.length > 0 },
  ]
  const completedCount = completenessFields.filter(f => f.filled).length
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fbfbf9' }}>
        <div style={{ color: '#91918c' }}>加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fbfbf9' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#000' }}>账号设置</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar nav */}
          <nav className="md:w-48 shrink-0">
            <div className="md:sticky md:top-24 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeSection === item.key
                      ? 'text-white'
                      : ''
                  }`}
                  style={activeSection === item.key
                    ? { backgroundColor: '#F97316', color: '#fff' }
                    : { color: '#62625b' }
                  }
                  onMouseEnter={e => {
                    if (activeSection !== item.key) {
                      (e.target as HTMLElement).style.backgroundColor = '#f6f6f3'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeSection !== item.key) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right content area */}
          <div className="flex-1 min-w-0">

            {/* ===== BASIC INFO SECTION ===== */}
            {activeSection === 'basic' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={message.type === 'success'
                      ? { backgroundColor: '#c7f0da', color: '#103c25' }
                      : { backgroundColor: '#FEE2E2', color: '#9e0a0a' }
                    }
                  >
                    {message.text}
                  </div>
                )}

                {/* Avatar */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#000' }}>
                    <Camera className="h-4 w-4" style={{ color: '#F97316' }} />
                    头像
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ border: '2px solid #e5e5e0', backgroundColor: '#f6f6f3' }}>
                      {avatar ? (
                        <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8" style={{ color: '#91918c' }} />
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
                </div>

                {/* Account security */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#000' }}>
                    <Mail className="h-4 w-4" style={{ color: '#F97316' }} />
                    邮箱
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#33332e' }}>
                        {userEmail || '未绑定'}
                        {userEmail && (
                          emailVerified ? (
                            <span className="ml-2 inline-flex items-center text-xs" style={{ color: '#103c25' }}>
                              <CheckCircle className="h-3.5 w-3.5 mr-0.5" />已验证
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center text-xs" style={{ color: '#EA580C' }}>
                              <AlertCircle className="h-3.5 w-3.5 mr-0.5" />未验证
                            </span>
                          )
                        )}
                      </p>
                    </div>
                    {userEmail && !emailVerified && (
                      <div className="text-right">
                        {verifySent ? (
                          <p className="text-sm" style={{ color: '#103c25' }}>已发送，请检查收件箱</p>
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
                          <p className="text-xs mt-1" style={{ color: '#9e0a0a' }}>{verifyError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic fields */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#000' }}>
                    <User className="h-4 w-4" style={{ color: '#F97316' }} />
                    基本信息
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>昵称</label>
                      <div className="flex gap-2">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="你的昵称"
                          disabled={nameIsSet}
                          className={nameIsSet ? 'bg-surface-soft text-mute' : ''}
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
                        <p className="text-xs mt-1" style={{ color: '#91918c' }}>昵称设置后不可修改</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>个人简介</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="介绍一下你自己..."
                        className="w-full h-24 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>
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
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>
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
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        微信号
                      </label>
                      <Input
                        value={wechat}
                        onChange={(e) => setWechat(e.target.value)}
                        placeholder="你的微信号"
                      />
                    </div>
                    <p className="text-xs" style={{ color: '#91918c' }}>用户ID：{username}（系统生成，不可修改）</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? '保存中...' : '保存基本信息'}
                  </Button>
                </div>
              </form>
            )}

            {/* ===== CARD SECTION ===== */}
            {activeSection === 'card' && (
              <div className="space-y-6">
                {cardMessage && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={cardMessage.type === 'success'
                      ? { backgroundColor: '#c7f0da', color: '#103c25' }
                      : { backgroundColor: '#FEE2E2', color: '#9e0a0a' }
                    }
                  >
                    {cardMessage.text}
                    {cardMessage.type === 'success' && showInPlaza && (
                      <Link href="/plaza" className="ml-2 underline font-medium" style={{ color: '#103c25' }}>
                        去广场看看你的卡片 →
                      </Link>
                    )}
                  </div>
                )}

                {/* Completeness */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#33332e' }}>卡片完善度</span>
                    <span className="text-sm font-semibold" style={{ color: '#F97316' }}>{completenessPercent}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: '#e5e5e0' }}>
                    <div
                      className="rounded-full h-2 transition-all"
                      style={{ width: `${completenessPercent}%`, backgroundColor: '#F97316' }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#91918c' }}>
                    完善卡片信息，让其他创业者更容易找到你
                  </p>
                </div>

                {/* Show in plaza toggle */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#33332e' }}>在广场展示卡片</p>
                      <p className="text-xs mt-0.5" style={{ color: '#91918c' }}>开启后，你的卡片将出现在创业者广场</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInPlaza(!showInPlaza)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: showInPlaza ? '#F97316' : '#c8c8c1' }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                        style={{ transform: showInPlaza ? 'translateX(24px)' : 'translateX(4px)' }}
                      />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#91918c' }}>
                    {showInPlaza ? (
                      <><Eye className="h-3.5 w-3.5" /> 当前：公开展示</>
                    ) : (
                      <><EyeOff className="h-3.5 w-3.5" /> 当前：不展示</>
                    )}
                  </div>
                </div>

                {/* Card fields */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
                  <h3 className="text-base font-semibold mb-4" style={{ color: '#000' }}>卡片信息</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>创业方向（赛道）</label>
                      <Input
                        value={mainTrack}
                        onChange={(e) => setMainTrack(e.target.value)}
                        placeholder="如：AI教育、跨境电商、SaaS"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#33332e' }}>创业阶段</label>
                      <select
                        value={startupStage}
                        onChange={(e) => setStartupStage(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                        style={{ color: '#33332e' }}
                      >
                        <option value="">请选择</option>
                        {STAGE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleCardSave} disabled={savingCard} className="gap-2">
                    <Save className="h-4 w-4" />
                    {savingCard ? '保存中...' : '保存卡片'}
                  </Button>
                </div>
              </div>
            )}

            {/* ===== PROJECTS SECTION ===== */}
            {activeSection === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold" style={{ color: '#000' }}>我的产品</h3>
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
                </div>

                {showNewProject && (
                  <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: '#f6f6f3', border: '1px solid #dadad3' }}>
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
                        className="px-3 py-2 text-sm border rounded-xl bg-white"
                      >
                        {STAGE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <select
                        value={newProject.contentType}
                        onChange={e => setNewProject(prev => ({ ...prev, contentType: e.target.value }))}
                        className="px-3 py-2 text-sm border rounded-xl bg-white"
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
                  <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #dadad3' }}>
                    <Rocket className="h-10 w-10 mx-auto mb-3" style={{ color: '#c8c8c1' }} />
                    <p className="text-sm" style={{ color: '#91918c' }}>暂无产品，点击"添加"创建你的第一个产品</p>
                  </div>
                )}

                {projects.map(proj => (
                  <div key={proj.id} className="bg-white rounded-2xl p-5 flex items-start justify-between" style={{ border: '1px solid #dadad3' }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: '#000' }}>{proj.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f6f6f3', color: '#62625b' }}>
                          {CONTENT_TYPE_OPTIONS.find(o => o.value === proj.contentType)?.label || proj.contentType}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#62625b' }}>{proj.tagline}</p>
                      {proj.website && (
                        <a href={ensureUrl(proj.website)} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-1.5 hover:underline" style={{ color: '#F97316' }}>
                          <ExternalLink className="h-3 w-3" />{proj.website}
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="shrink-0 ml-3 p-1.5 rounded-lg transition-colors"
                      style={{ color: '#91918c' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9e0a0a' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#91918c' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
