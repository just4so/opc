'use client'

import { useState } from 'react'
import { ImageUpload } from '@/components/admin/image-upload'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-notification'

interface Manager {
  id: string
  name: string
  avatar: string | null
  title: string | null
  bio: string | null
  quote: string | null
  focusTags: string[]
  wechat: string | null
  city: string | null
  province: string
  scope: string
}

interface MyProfileClientProps {
  manager: Manager | null
}

export function MyProfileClient({ manager }: MyProfileClientProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: manager?.name ?? '',
    avatar: manager?.avatar ?? '',
    title: manager?.title ?? '',
    bio: manager?.bio ?? '',
    quote: manager?.quote ?? '',
    focusTagsInput: manager?.focusTags.join('，') ?? '',
    wechat: manager?.wechat ?? '',
  })

  async function handleSave() {
    setSaving(true)
    try {
      const focusTags = form.focusTagsInput
        ? form.focusTagsInput.split(/[,，、]/).map(t => t.trim()).filter(Boolean)
        : []

      const res = await fetch('/api/manager/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          avatar: form.avatar || null,
          title: form.title.trim() || null,
          bio: form.bio.trim() || null,
          quote: form.quote.trim() || null,
          focusTags,
          wechat: form.wechat.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error || '保存失败', 'error')
        return
      }

      toast('信息已更新', 'success')
    } finally {
      setSaving(false)
    }
  }

  if (!manager) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-mute">
        <p>未找到主理人记录，请联系管理员。</p>
      </div>
    )
  }

  const cityLabel = manager.city
    ? `${manager.city}，${manager.province}`
    : `${manager.province}（省级）`
  const scopeLabel = manager.scope === 'PROVINCE' ? '省级' : '地级市'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">我的主页</h1>
        <p className="text-mute text-sm mt-1">管理你在 /local 页面的展示信息</p>
      </div>

      {/* 只读信息 */}
      <div className="bg-surface-card border border-hairline rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">管辖信息（只读）</h2>
        <div className="flex gap-6 text-sm text-mute">
          <span>城市：<span className="text-ink font-medium">{cityLabel}</span></span>
          <span>范围：<span className="text-ink font-medium">{scopeLabel}</span></span>
        </div>
      </div>

      {/* 可编辑区 */}
      <div className="space-y-5">
        {/* 头像 */}
        <ImageUpload
          label="头像"
          value={form.avatar || null}
          onChange={url => setForm(f => ({ ...f, avatar: url }))}
          uploadUrl="/api/upload/avatar"
        />

        {/* 名字 */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">名字</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="你的真实姓名或昵称"
          />
        </div>

        {/* 头衔 */}
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

        {/* 个人简介 */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">个人简介</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            placeholder="简短介绍你的创业背景..."
          />
        </div>

        {/* 主理人寄语 */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            主理人寄语
            <span className="text-xs text-mute ml-2 font-normal">显示在主理人卡片上</span>
          </label>
          <input
            type="text"
            value={form.quote}
            onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="一句话宣言，引号展示"
          />
        </div>

        {/* 专长标签 */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">专长标签</label>
          <input
            type="text"
            value={form.focusTagsInput}
            onChange={e => setForm(f => ({ ...f, focusTagsInput: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="AI落地，跨境电商（逗号分隔）"
          />
        </div>

        {/* 社群二维码 */}
        <div className="space-y-1">
          <ImageUpload
            label="社群二维码"
            value={form.wechat && form.wechat.startsWith('http') ? form.wechat : null}
            onChange={url => setForm(f => ({ ...f, wechat: url }))}
            uploadUrl="/api/upload/qrcode"
          />
          <p className="text-xs text-mute pl-1">
            上传你管理的同城 OPC 创业者微信群二维码，定期更换确保有效
          </p>
          {(!form.wechat || !form.wechat.startsWith('http')) && (
            <div className="pt-1">
              <label className="block text-sm font-medium text-ink mb-1">微信号（旧格式）</label>
              <input
                type="text"
                value={form.wechat && !form.wechat.startsWith('http') ? form.wechat : ''}
                onChange={e => setForm(f => ({ ...f, wechat: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="如已上传二维码，此处留空"
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  )
}
