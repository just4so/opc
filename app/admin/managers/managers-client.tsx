'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Edit, Trash2, User, CheckCircle, XCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ImageUpload } from '@/components/admin/image-upload'
import { AvatarUpload } from '@/components/admin/avatar-upload'
import { PROVINCES, PROVINCE_CITIES } from '@/lib/china-regions'

type ManagerStatus = 'ACTIVE' | 'INACTIVE'
type ManagerScope = 'CITY' | 'PROVINCE'

interface BoundUser {
  id: string
  email: string | null
  name: string | null
  username: string
}

interface Manager {
  id: string
  userId: string | null
  name: string
  avatar: string | null
  title: string | null
  bio: string | null
  quote: string | null
  focusTags: string[]
  wechat: string | null
  scope: ManagerScope
  city: string | null
  province: string
  order: number
  status: ManagerStatus
  createdAt: string
  updatedAt: string
  user: BoundUser | null
}

interface FormData {
  name: string
  avatar: string
  title: string
  bio: string
  quote: string
  focusTagsInput: string
  wechat: string
  scope: ManagerScope
  city: string
  province: string
  order: number
  status: ManagerStatus
  userId: string
  userSearchQuery: string
  userSearchResults: BoundUser[]
}

const DEFAULT_FORM: FormData = {
  name: '',
  avatar: '',
  title: '',
  bio: '',
  quote: '',
  focusTagsInput: '',
  wechat: '',
  scope: 'CITY',
  city: '',
  province: '',
  order: 0,
  status: 'ACTIVE',
  userId: '',
  userSearchQuery: '',
  userSearchResults: [],
}

export default function ManagersClient() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | ManagerStatus>('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [userSearching, setUserSearching] = useState(false)

  const fetchManagers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      const res = await fetch(`/api/admin/managers?${params}`)
      if (res.ok) setManagers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchManagers() }, [fetchManagers])

  function openCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setError('')
    setDialogOpen(true)
  }

  function openEdit(m: Manager) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      avatar: m.avatar || '',
      title: m.title || '',
      bio: m.bio || '',
      quote: m.quote || '',
      focusTagsInput: m.focusTags.join('，'),
      wechat: m.wechat || '',
      scope: m.scope,
      city: m.city || '',
      province: m.province,
      order: m.order,
      status: m.status,
      userId: m.userId || '',
      userSearchQuery: m.user ? (m.user.name || m.user.username) : '',
      userSearchResults: [],
    })
    setError('')
    setDialogOpen(true)
  }

  async function searchUsers(query: string) {
    if (!query.trim()) { setForm(f => ({ ...f, userSearchResults: [] })); return }
    setUserSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setForm(f => ({ ...f, userSearchResults: data.users || [] }))
      }
    } finally {
      setUserSearching(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('姓名为必填项'); return }
    if (!form.province) { setError('请选择省份'); return }
    if (form.scope === 'CITY' && !form.city) { setError('城市范围时城市为必填'); return }

    setSaving(true)
    setError('')
    try {
      const focusTags = form.focusTagsInput
        ? form.focusTagsInput.split(/[,，、]/).map(t => t.trim()).filter(Boolean)
        : []

      const body = {
        name: form.name.trim(),
        avatar: form.avatar || null,
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
        quote: form.quote.trim() || null,
        focusTags,
        wechat: form.wechat.trim() || null,
        scope: form.scope,
        city: form.scope === 'CITY' ? form.city : null,
        province: form.province,
        order: form.order,
        status: form.status,
        userId: form.userId || null,
      }

      const url = editingId ? `/api/admin/managers/${editingId}` : '/api/admin/managers'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '保存失败'); return }

      setDialogOpen(false)
      fetchManagers()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(m: Manager) {
    const newStatus: ManagerStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const res = await fetch(`/api/admin/managers/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) fetchManagers()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/managers/${id}`, { method: 'DELETE' })
    if (res.ok) { setDeleteConfirm(null); fetchManagers() }
  }

  const filteredManagers = managers.filter(m =>
    filterStatus === 'ALL' || m.status === filterStatus
  )

  const availableCities = form.province ? PROVINCE_CITIES[form.province] || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">主理人管理</h1>
          <p className="text-mute text-sm mt-1">管理城市主理人展示信息与账号绑定</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新增主理人
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary text-white'
                : 'bg-surface-card border border-hairline text-mute hover:text-ink'
            }`}
          >
            {s === 'ALL' ? '全部' : s === 'ACTIVE' ? '启用' : '停用'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-mute">加载中...</div>
        ) : filteredManagers.length === 0 ? (
          <div className="p-8 text-center text-mute">暂无主理人</div>
        ) : (
          <table className="w-full">
            <thead className="bg-surface-soft border-b border-hairline">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">主理人</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">管辖范围</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">绑定账号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">排序</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-mute">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map(m => (
                <tr key={m.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-soft flex-shrink-0">
                        {m.avatar ? (
                          <Image src={m.avatar} alt={m.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ash">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-ink text-sm">{m.name}</div>
                        {m.title && <div className="text-xs text-mute">{m.title}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink">
                      {m.scope === 'PROVINCE' ? `${m.province}（省级）` : `${m.city}，${m.province}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.user ? (
                      <div className="text-sm">
                        <div className="text-ink font-medium">{m.user.name || m.user.username}</div>
                        <div className="text-xs text-mute">{m.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-ash">未绑定</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                    >
                      {m.status === 'ACTIVE' ? '启用' : '停用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-mute">{m.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(m)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          m.status === 'ACTIVE'
                            ? 'text-mute hover:text-amber-600 hover:bg-amber-50'
                            : 'text-mute hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={m.status === 'ACTIVE' ? '停用' : '启用'}
                      >
                        {m.status === 'ACTIVE' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(m.id)}
                        className="p-1.5 rounded-lg text-mute hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑主理人' : '新增主理人'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Avatar */}
            <AvatarUpload
              value={form.avatar || null}
              onChange={url => setForm(f => ({ ...f, avatar: url }))}
              label="形象照"
            />

            {/* Name & Title */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="如：张三"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">头衔</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="如：武汉主理人 · AI创业者"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">个人简介</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                placeholder="简短介绍个人背景..."
              />
            </div>

            {/* Quote */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">个人金句</label>
              <input
                type="text"
                value={form.quote}
                onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="一句话宣言，前台引用展示"
              />
            </div>

            {/* Focus Tags & WeChat */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">领域标签</label>
              <input
                type="text"
                value={form.focusTagsInput}
                onChange={e => setForm(f => ({ ...f, focusTagsInput: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="AI落地，跨境电商（逗号分隔）"
              />
            </div>

            {/* WeChat QR Code */}
            <div className="space-y-3">
              <ImageUpload
                label="社群二维码"
                value={form.wechat && form.wechat.startsWith('http') ? form.wechat : null}
                onChange={url => setForm(f => ({ ...f, wechat: url }))}
                uploadUrl="/api/upload/qrcode"
              />
            </div>

            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">管辖范围</label>
              <div className="flex gap-3 mb-3">
                {(['CITY', 'PROVINCE'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, scope: s, city: '' }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      form.scope === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-hairline text-mute hover:text-ink'
                    }`}
                  >
                    {s === 'CITY' ? '地级市' : '省份'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-mute mb-1">省份 <span className="text-red-500">*</span></label>
                  <select
                    value={form.province}
                    onChange={e => setForm(f => ({ ...f, province: e.target.value, city: '' }))}
                    className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                  >
                    <option value="">选择省份</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {form.scope === 'CITY' && (
                  <div>
                    <label className="block text-xs text-mute mb-1">城市 <span className="text-red-500">*</span></label>
                    <select
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                      disabled={!form.province}
                    >
                      <option value="">选择城市</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">排序权重</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="越大越靠前"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">状态</label>
                <div className="flex gap-3">
                  {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-full text-sm font-medium border transition-colors ${
                        form.status === s
                          ? s === 'ACTIVE' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-400 text-white border-gray-400'
                          : 'border-hairline text-mute hover:text-ink'
                      }`}
                    >
                      {s === 'ACTIVE' ? '启用' : '停用'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Binding */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">绑定账号</label>
              <p className="text-xs text-mute mb-2">绑定后该用户自动升级为城市主理人角色；解绑后降回普通用户（ADMIN/MODERATOR不受影响）</p>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ash" />
                    <input
                      type="text"
                      value={form.userSearchQuery}
                      onChange={e => {
                        setForm(f => ({ ...f, userSearchQuery: e.target.value }))
                        searchUsers(e.target.value)
                      }}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="搜索用户名或邮箱..."
                    />
                  </div>
                  {form.userId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, userId: '', userSearchQuery: '', userSearchResults: [] }))}
                    >
                      解绑
                    </Button>
                  )}
                </div>

                {form.userSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-hairline rounded-2xl shadow-lg mt-1 overflow-hidden">
                    {form.userSearchResults.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          userId: u.id,
                          userSearchQuery: u.name || u.username,
                          userSearchResults: [],
                        }))}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-soft transition-colors"
                      >
                        <div className="text-sm font-medium text-ink">{u.name || u.username}</div>
                        <div className="text-xs text-mute">{u.email} · @{u.username}</div>
                      </button>
                    ))}
                  </div>
                )}

                {userSearching && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-hairline rounded-2xl shadow-lg mt-1 p-3 text-center text-sm text-mute">
                    搜索中...
                  </div>
                )}

                {form.userId && (
                  <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    已选绑定账号 ID：{form.userId}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-mute py-2">删除后不可恢复，绑定的用户账号将降回普通用户。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
