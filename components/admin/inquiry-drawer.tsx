'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Upload, FileText, Download, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type InquiryStatus = 'PENDING' | 'CONTACTED' | 'DONE' | 'CANCELLED'

interface InquiryDetail {
  id: string
  name: string
  contact: string
  city: string | null
  communityName: string | null
  introduction: string | null
  stage: string | null
  status: InquiryStatus
  bpUrl: string | null
  bpFilename: string | null
  adminNote: string | null
  wantCard: boolean
  wantVerify: boolean
  acceptInterview: boolean
  createdAt: string
  updatedAt: string
  community: { id: string; name: string; slug: string } | null
  user: {
    id: string
    username: string
    name: string | null
    email: string | null
    bio: string | null
    mainTrack: string | null
    startupStage: string | null
    location: string | null
    avatar: string | null
    verified: boolean
    verifyType: string | null
  } | null
}

const STATUS_OPTIONS: { value: InquiryStatus; label: string; className: string }[] = [
  { value: 'PENDING', label: '待跟进', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONTACTED', label: '已联系', className: 'bg-blue-100 text-blue-800' },
  { value: 'DONE', label: '已完成', className: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: '已取消', className: 'bg-gray-100 text-gray-600' },
]

interface InquiryDrawerProps {
  inquiryId: string | null
  onClose: () => void
  onSaved: () => void
}

export function InquiryDrawer({ inquiryId, onClose, onSaved }: InquiryDrawerProps) {
  const [data, setData] = useState<InquiryDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    contact: '',
    city: '',
    introduction: '',
    stage: '',
    adminNote: '',
    status: 'PENDING' as InquiryStatus,
    bpUrl: null as string | null,
    bpFilename: null as string | null,
  })

  const [userForm, setUserForm] = useState({
    bio: '',
    mainTrack: '',
    startupStage: '',
  })
  const [savingUser, setSavingUser] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`)
      if (!res.ok) throw new Error('获取失败')
      const detail: InquiryDetail = await res.json()
      setData(detail)
      setForm({
        name: detail.name,
        contact: detail.contact,
        city: detail.city || '',
        introduction: detail.introduction || '',
        stage: detail.stage || '',
        adminNote: detail.adminNote || '',
        status: detail.status,
        bpUrl: detail.bpUrl,
        bpFilename: detail.bpFilename,
      })
      if (detail.user) {
        setUserForm({
          bio: detail.user.bio || '',
          mainTrack: detail.user.mainTrack || '',
          startupStage: detail.user.startupStage || '',
        })
      }
    } catch {
      setMessage({ type: 'error', text: '加载意向详情失败' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (inquiryId) {
      fetchDetail(inquiryId)
    }
  }, [inquiryId, fetchDetail])

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
      const res = await fetch(`/api/admin/inquiries/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          city: form.city || undefined,
          introduction: form.introduction || undefined,
          stage: form.stage || undefined,
          adminNote: form.adminNote || null,
          status: form.status,
          bpUrl: form.bpUrl,
          bpFilename: form.bpFilename,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '保存失败')
      }
      setMessage({ type: 'success', text: '保存成功' })
      onSaved()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveUser() {
    if (!data?.user) return
    setSavingUser(true)
    try {
      const res = await fetch(`/api/admin/users/${data.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: userForm.bio || null,
          mainTrack: userForm.mainTrack || null,
          startupStage: userForm.startupStage || null,
        }),
      })
      if (!res.ok) throw new Error('保存失败')
      setMessage({ type: 'success', text: '用户信息已更新' })
    } catch {
      setMessage({ type: 'error', text: '更新用户信息失败' })
    } finally {
      setSavingUser(false)
    }
  }

  async function handleBpUpload(file: File) {
    setUploading(true)
    try {
      const presignRes = await fetch('/api/upload/bp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error('获取上传链接失败')
      const { uploadUrl, publicUrl } = await presignRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('上传失败')

      setForm((prev) => ({ ...prev, bpUrl: publicUrl, bpFilename: file.name }))
      setMessage({ type: 'success', text: 'BP上传成功，记得点保存' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '上传失败' })
    } finally {
      setUploading(false)
    }
  }

  const isOpen = !!inquiryId

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
            <h2 className="text-lg font-semibold text-gray-900">意向详情</h2>
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
                {/* Status */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">状态</Label>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          form.status === opt.value
                            ? `${opt.className} ring-2 ring-offset-1 ring-current`
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inquiry Fields */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">意向信息</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">称呼</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">联系方式</Label>
                      <Input
                        value={form.contact}
                        onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">城市</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">阶段</Label>
                      <Input
                        value={form.stage}
                        onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">意向社区</Label>
                    <div className="mt-1 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {data.community?.name || data.communityName || '通用直通车'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">方向介绍</Label>
                    <textarea
                      value={form.introduction}
                      onChange={(e) => setForm((f) => ({ ...f, introduction: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* BP Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">商业计划书</h3>
                  {form.bpUrl ? (
                    <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <a
                        href={form.bpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-sm text-primary hover:underline"
                      >
                        {form.bpFilename || 'BP文件'}
                      </a>
                      <a
                        href={form.bpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">暂无BP</div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleBpUpload(file)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1.5" />
                    )}
                    {form.bpUrl ? '替换BP' : '上传BP'}
                  </Button>
                </div>

                {/* User Info Section */}
                {data.user && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">用户信息</h3>
                      <div className="flex items-center gap-2">
                        {data.user.verified && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">已认证</Badge>
                        )}
                        <a
                          href={`/profile/${data.user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          @{data.user.username}
                        </a>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">简介</Label>
                      <textarea
                        value={userForm.bio}
                        onChange={(e) => setUserForm((f) => ({ ...f, bio: e.target.value }))}
                        rows={2}
                        maxLength={200}
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">赛道</Label>
                        <Input
                          value={userForm.mainTrack}
                          onChange={(e) => setUserForm((f) => ({ ...f, mainTrack: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">阶段</Label>
                        <Input
                          value={userForm.startupStage}
                          onChange={(e) => setUserForm((f) => ({ ...f, startupStage: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingUser}
                      onClick={handleSaveUser}
                    >
                      {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                      保存用户信息
                    </Button>
                  </div>
                )}

                {/* Admin Note */}
                <div>
                  <Label className="text-xs text-gray-500">内部备注</Label>
                  <textarea
                    value={form.adminNote}
                    onChange={(e) => setForm((f) => ({ ...f, adminNote: e.target.value }))}
                    rows={3}
                    maxLength={1000}
                    placeholder="仅内部可见的运营备注..."
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Meta */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div>创建时间：{new Date(data.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                  <div>更新时间：{new Date(data.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                  <div className="flex gap-3">
                    {data.wantCard && <span>想要卡片</span>}
                    {data.wantVerify && <span>想要认证</span>}
                    {data.acceptInterview && <span>愿意采访</span>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || loading} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              保存意向
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
