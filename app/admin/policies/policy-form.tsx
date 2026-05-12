'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PolicyFormData {
  province: string
  city: string
  district: string
  title: string
  summary: string
  sourceUrl: string
  status: string
}

interface PolicyFormProps {
  initialData?: Partial<PolicyFormData> & { id?: string }
  mode: 'new' | 'edit'
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '已发布' },
  { value: 'DRAFT', label: '征求意见' },
  { value: 'EXPIRED', label: '已过期' },
]

export default function PolicyForm({ initialData, mode }: PolicyFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<PolicyFormData>({
    province: initialData?.province || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    sourceUrl: initialData?.sourceUrl || '',
    status: initialData?.status || 'ACTIVE',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url =
        mode === 'edit' && initialData?.id
          ? `/api/admin/policies/${initialData.id}`
          : '/api/admin/policies'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '保存失败')
        return
      }

      router.push('/admin/policies')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'new' ? '新增政策' : '编辑政策'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                省份 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                required
                placeholder="如：北京，不加「市」"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="如：北京，直辖市填与省份相同；省级政策留空"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区县</label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="如：海淀区，市级政策留空"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              政策名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="政策全称"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              核心扶持摘要 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              required
              rows={3}
              placeholder="面向用户的一句话说明，100字以内"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原文链接</label>
            <input
              type="url"
              name="sourceUrl"
              value={form.sourceUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/policies')}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
