'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, Camera, User, MapPin, Globe, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarPicker } from '@/components/ui/avatar-picker'
import { useToast } from '@/components/ui/toast-notification'
import { useSession } from 'next-auth/react'

const STAGE_OPTIONS = [
  { value: 'IDEA', label: '想法阶段' },
  { value: 'BUILDING', label: '开发中' },
  { value: 'LAUNCHED', label: '已上线' },
  { value: 'REVENUE', label: '有收入' },
  { value: 'PROFITABLE', label: '已盈利' },
]

interface Props {
  userId: string
}

export function ProfileSection({ userId }: Props) {
  const { update } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const [avatar, setAvatar] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [nameIsSet, setNameIsSet] = useState(false)
  const [settingName, setSettingName] = useState(false)
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [wechat, setWechat] = useState('')
  const [mainTrack, setMainTrack] = useState('')
  const [startupStage, setStartupStage] = useState('')
  const [showInPlaza, setShowInPlaza] = useState(false)

  const [subTab, setSubTab] = useState<'posts' | 'favorites' | 'following' | 'followers'>('posts')
  const [tabData, setTabData] = useState<any[]>([])
  const [tabLoading, setTabLoading] = useState(false)
  const [favSubTab, setFavSubTab] = useState<'projects' | 'posts'>('projects')

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    fetchTabData()
  }, [subTab, favSubTab, userId])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setAvatar(data.avatar)
        setUsername(data.username)
        setName(data.name || '')
        setNameIsSet(!!data.name)
        setBio(data.bio || '')
        setLocation(data.location || '')
        setWebsite(data.website || '')
        setWechat(data.wechat || '')
        setMainTrack(data.mainTrack || '')
        setStartupStage(data.startupStage || '')
        setShowInPlaza(data.showInPlaza || false)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchTabData = async () => {
    setTabLoading(true)
    try {
      let url = ''
      if (subTab === 'posts') url = '/api/user/posts'
      else if (subTab === 'favorites') url = `/api/user/favorites?type=${favSubTab}`
      else if (subTab === 'following') url = `/api/follow/${userId}/following`
      else if (subTab === 'followers') url = `/api/follow/${userId}/followers`

      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setTabData(json.data || json.users || [])
      }
    } catch {} finally {
      setTabLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const [profileRes, cardRes] = await Promise.all([
        fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar, bio, location, website, wechat }),
        }),
        fetch('/api/user/card', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio, mainTrack, startupStage, location, wechat, showInPlaza }),
        }),
      ])
      if (profileRes.ok) {
        await update({ image: avatar || null })
        toast('保存成功', 'success')
      } else {
        const data = await profileRes.json()
        toast(data.error || '保存失败', 'error')
      }
    } catch {
      toast('保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSetName = async () => {
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
        toast('昵称设置成功', 'success')
      } else {
        toast(data.error || '设置失败', 'error')
      }
    } catch {
      toast('设置失败', 'error')
    } finally {
      setSettingName(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-mute">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl p-6 border border-hairline">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
            <Camera className="h-4 w-4 text-primary" />
            头像
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-hairline bg-surface-card">
              {avatar ? (
                <img src={avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-ash" />
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
              更换头像
            </Button>
          </div>
          {showAvatarPicker && (
            <div className="mt-4">
              <AvatarPicker currentAvatar={avatar} onSelect={(url) => { setAvatar(url); setShowAvatarPicker(false) }} onClose={() => setShowAvatarPicker(false)} />
            </div>
          )}
        </div>

        {/* Basic info + card fields merged */}
        <div className="bg-white rounded-2xl p-6 border border-hairline">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
            <User className="h-4 w-4 text-primary" />
            个人资料
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal">昵称</label>
              <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="你的昵称" disabled={nameIsSet} className={nameIsSet ? 'bg-surface-soft text-mute' : ''} />
                {!nameIsSet && (
                  <Button type="button" size="sm" onClick={handleSetName} disabled={settingName || !name.trim()}>
                    {settingName ? '设置中...' : '设置昵称'}
                  </Button>
                )}
              </div>
              {nameIsSet && <p className="text-xs mt-1 text-ash">昵称设置后不可修改</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal">个人简介</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="介绍一下你自己..." className="w-full h-24 px-4 py-3 border border-hairline rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal">创业方向（赛道）</label>
              <Input value={mainTrack} onChange={e => setMainTrack(e.target.value)} placeholder="如：AI教育、跨境电商、SaaS" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal">创业阶段</label>
              <select value={startupStage} onChange={e => setStartupStage(e.target.value)} className="w-full px-4 py-2.5 border border-hairline rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-charcoal">
                <option value="">请选择</option>
                {STAGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal"><MapPin className="h-4 w-4 inline mr-1" />所在城市</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="如：深圳" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal"><Globe className="h-4 w-4 inline mr-1" />个人网站</label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://your-website.com" type="url" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-charcoal"><MessageSquare className="h-4 w-4 inline mr-1" />微信号</label>
              <Input value={wechat} onChange={e => setWechat(e.target.value)} placeholder="你的微信号" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium text-charcoal">在广场展示卡片</p>
                <p className="text-xs mt-0.5 text-ash">开启后，你的卡片将出现在创业者广场</p>
              </div>
              <button type="button" onClick={() => setShowInPlaza(!showInPlaza)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ backgroundColor: showInPlaza ? '#F97316' : '#c8c8c1' }}>
                <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: showInPlaza ? 'translateX(24px)' : 'translateX(4px)' }} />
              </button>
            </div>
            <p className="text-xs text-ash">用户ID：{username}（系统生成，不可修改）</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存资料'}
          </Button>
        </div>
      </form>

      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
        <div className="flex border-b border-hairline">
          {(['posts', 'favorites', 'following', 'followers'] as const).map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${subTab === tab ? 'text-primary border-b-2 border-primary' : 'text-mute hover:text-ink'}`}>
              {tab === 'posts' ? '我的动态' : tab === 'favorites' ? '我的喜欢' : tab === 'following' ? '我的关注' : '我的粉丝'}
            </button>
          ))}
        </div>

        {subTab === 'favorites' && (
          <div className="flex gap-4 px-6 pt-4">
            <button onClick={() => setFavSubTab('projects')} className={`text-sm pb-1 ${favSubTab === 'projects' ? 'text-primary font-medium border-b border-primary' : 'text-mute'}`}>喜欢的产品</button>
            <button onClick={() => setFavSubTab('posts')} className={`text-sm pb-1 ${favSubTab === 'posts' ? 'text-primary font-medium border-b border-primary' : 'text-mute'}`}>喜欢的帖子</button>
          </div>
        )}

        <div className="p-6">
          {tabLoading ? (
            <p className="text-center text-ash py-8">加载中...</p>
          ) : tabData.length === 0 ? (
            <p className="text-center text-ash py-8">暂无内容</p>
          ) : (
            <div className="space-y-3">
              {subTab === 'posts' && tabData.map((post: any) => (
                <Link key={post.id} href={`/plaza/${post.id}`} className="block p-4 rounded-2xl border border-hairline hover:shadow-sm transition-shadow">
                  <p className="text-sm font-medium text-ink line-clamp-1">{post.title || post.content?.slice(0, 60)}</p>
                  <p className="text-xs text-ash mt-1">{post.type} · {post.createdAt?.slice(0, 10)}</p>
                </Link>
              ))}
              {subTab === 'favorites' && favSubTab === 'posts' && tabData.map((fav: any) => (
                <Link key={fav.id} href={fav.post ? `/plaza/${fav.post.id}` : '#'} className="block p-4 rounded-2xl border border-hairline hover:shadow-sm transition-shadow">
                  <p className="text-sm font-medium text-ink line-clamp-1">{fav.post?.title || fav.post?.content?.slice(0, 60)}</p>
                  <p className="text-xs text-ash mt-1">{fav.post?.type} · {fav.post?.createdAt?.slice(0, 10)}</p>
                </Link>
              ))}
              {subTab === 'favorites' && favSubTab === 'projects' && tabData.map((fav: any) => (
                <Link key={fav.id} href={fav.project?.slug ? `/projects/${fav.project.slug}` : '#'} className="block p-4 rounded-2xl border border-hairline hover:shadow-sm transition-shadow">
                  <p className="text-sm font-medium text-ink">{fav.project?.name}</p>
                  <p className="text-xs text-ash mt-1 line-clamp-1">{fav.project?.description}</p>
                </Link>
              ))}
              {(subTab === 'following' || subTab === 'followers') && tabData.map((u: any) => (
                <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 p-4 rounded-2xl border border-hairline hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{u.name || u.username}</p>
                    {u.mainTrack && <p className="text-xs text-ash">{u.mainTrack}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
