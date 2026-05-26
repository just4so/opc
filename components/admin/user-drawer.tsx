'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Check, AlertCircle, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type VerifyType = 'IDENTITY' | 'ENTREPRENEUR' | 'EXPERT' | 'COMMUNITY'

const VERIFY_TYPE_LABELS: Record<VerifyType, string> = {
  IDENTITY: '身份认证',
  ENTREPRENEUR: '创业者认证',
  EXPERT: '专家认证',
  COMMUNITY: '社区认证',
}

const VERIFY_TYPES: VerifyType[] = ['IDENTITY', 'ENTREPRENEUR', 'EXPERT', 'COMMUNITY']

interface InquiryRecord {
  id: string
  communityName: string | null
  status: string
  createdAt: string
  community: { name: string } | null
}

interface UserDetail {
  id: string
  username: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  mainTrack: string | null
  startupStage: string | null
  role: string
  level: number
  verified: boolean
  verifyType: VerifyType | null
  showInPlaza: boolean
  createdAt: string
  inquiries: InquiryRecord[]
  _count: { posts: number; comments: number; inquiries: number }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待跟进', className: 'bg-yellow-100 text-yellow-800' },
  CONTACTED: { label: '已联系', className: 'bg-blue-100 text-blue-800' },
  DONE: { label: '已完成', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

interface UserDrawerProps {
  userId: string | null
  onClose: () => void
  onSaved: () => void
}

export function UserDrawer({ userId, onClose, onSaved }: UserDrawerProps) {
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    mainTrack: '',
    startupStage: '',
    website: '',
  })

  const [selectedVerifyType, setSelectedVerifyType] = useState<VerifyType>('ENTREPRENEUR')

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      if (!res.ok) throw new Error('获取失败')
      const detail: UserDetail = await res.json()
      setData(detail)
      setForm({
        name: detail.name || '',
        bio: detail.bio || '',
        location: detail.location || '',
        mainTrack: detail.mainTrack || '',
        startupStage: detail.startupStage || '',
        website: detail.website || '',
      })
      if (detail.verifyType) {
        setSelectedVerifyType(detail.verifyType)
      }
    } catch {
      setMessage({ type: 'error', text: '加载用户详情失败' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchDetail(userId)
    }
  }, [userId, fetchDetail])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  async function handleSave() {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          bio: form.bio || null,
          location: form.location || null,
          mainTrack: form.mainTrack || null,
          startupStage: form.startupStage || null,
          website: form.website || null,
        }),
      })
      if (!res.ok) throw new Error('保存失败')
      setMessage({ type: 'success', text: '保存成功' })
      onSaved()
    } catch {
      setMessage({ type: 'error', text: '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    if (!data) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/verify/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true, verifyType: selectedVerifyType }),
      })
      if (!res.ok) throw new Error('认证失败')
      setData((d) => d ? { ...d, verified: true, verifyType: selectedVerifyType } : null)
      setMessage({ type: 'success', text: '认证成功' })
      onSaved()
    } catch {
      setMessage({ type: 'error', text: '认证失败' })
    } finally {
      setVerifying(false)
    }
  }

  async function handleRevoke() {
    if (!data || !confirm('确认取消该用户的认证？')) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/verify/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: false }),
      })
      if (!res.ok) throw new Error('取消认证失败')
      setData((d) => d ? { ...d, verified: false, verifyType: null } : null)
      setMessage({ type: 'success', text: '已取消认证' })
      onSaved()
    } catch {
      setMessage({ type: 'error', text: '取消认证失败' })
    } finally {
      setVerifying(false)
    }
  }

  const isOpen = !!userId

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">用户详情</h2>
            <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                加载中...
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Avatar + Identity */}
                <div className="flex items-center gap-3">
                  {data.avatar ? (
                    <img src={data.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {data.name?.[0] || data.username[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{data.name || data.username}</span>
                      {data.verified && (
                        <Badge className="bg-blue-100 text-blue-800 gap-1 text-xs">
                          <BadgeCheck className="h-3 w-3" />
                          {VERIFY_TYPE_LABELS[data.verifyType!] || '已认证'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">@{data.username}</div>
                    {data.email && <div className="text-xs text-gray-400">{data.email}</div>}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">基本信息</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">姓名</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">城市</Label>
                      <Input
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">赛道</Label>
                      <Input
                        value={form.mainTrack}
                        onChange={(e) => setForm((f) => ({ ...f, mainTrack: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">阶段</Label>
                      <Input
                        value={form.startupStage}
                        onChange={(e) => setForm((f) => ({ ...f, startupStage: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">网站</Label>
                    <Input
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">简介</Label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      maxLength={200}
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Verify Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">认证管理</h3>
                  {data.verified ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        <BadgeCheck className="h-4 w-4" />
                        {VERIFY_TYPE_LABELS[data.verifyType!] || '已认证'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={verifying}
                        onClick={handleRevoke}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        取消认证
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {VERIFY_TYPES.map((vt) => (
                          <button
                            key={vt}
                            onClick={() => setSelectedVerifyType(vt)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              selectedVerifyType === vt
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {VERIFY_TYPE_LABELS[vt]}
                          </button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        disabled={verifying}
                        onClick={handleVerify}
                      >
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        确认认证
                      </Button>
                    </div>
                  )}
                </div>

                {/* Inquiry History */}
                {data.inquiries.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">历史意向</h3>
                    <div className="space-y-1.5">
                      {data.inquiries.map((inq) => {
                        const badge = STATUS_BADGE[inq.status] || STATUS_BADGE.PENDING
                        return (
                          <div key={inq.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge className={`${badge.className} text-xs shrink-0`}>{badge.label}</Badge>
                              <span className="text-gray-600 truncate">
                                {inq.community?.name || inq.communityName || '通用'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                              {new Date(inq.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">统计</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-md border px-3 py-2 text-center">
                      <div className="text-lg font-semibold text-gray-900">{data._count.posts}</div>
                      <div className="text-xs text-gray-500">帖子</div>
                    </div>
                    <div className="rounded-md border px-3 py-2 text-center">
                      <div className="text-lg font-semibold text-gray-900">{data._count.comments}</div>
                      <div className="text-xs text-gray-500">评论</div>
                    </div>
                    <div className="rounded-md border px-3 py-2 text-center">
                      <div className="text-lg font-semibold text-gray-900">{data._count.inquiries}</div>
                      <div className="text-xs text-gray-500">意向</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    注册时间：{new Date(data.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || loading} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              保存信息
            </Button>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
