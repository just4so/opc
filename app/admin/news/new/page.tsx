'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { label: '政策资讯', value: '政策资讯' },
  { label: '创业干货', value: '创业干货' },
  { label: '社区动态', value: '社区动态' },
  { label: '行业观察', value: '行业观察' },
]

function getTodayString() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export default function NewOriginalNewsPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    category: '创业干货',
    author: 'OPC圈运营团队',
    content: '',
    publishedAt: getTodayString(),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('标题不能为空')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          author: form.author,
          content: form.content,
          isOriginal: true,
          publishedAt: form.publishedAt,
          url: '',
        }),
      })
      if (res.ok) {
        router.push('/admin/news')
      } else {
        const data = await res.json()
        setError(data.error || '发布失败，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/news')}>
          ← 返回
        </Button>
        <h1 className="text-2xl font-bold text-secondary">写原创资讯</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新建原创资讯</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="请输入资讯标题"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 作者署名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作者署名</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="默认：OPC圈运营团队"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* 正文 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                正文 <span className="text-xs text-gray-400">（支持 Markdown）</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="请输入正文内容，支持 Markdown 格式..."
                style={{ height: 400 }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono text-sm"
              />
            </div>

            {/* 发布时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发布时间</label>
              <input
                type="date"
                name="publishedAt"
                value={form.publishedAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting} className="px-8">
                {submitting ? '发布中...' : '发布'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
