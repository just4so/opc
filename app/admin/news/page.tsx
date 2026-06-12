'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Search, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  summary: string | null
  url: string
  source: string
  category: string
  publishedAt: string
  isOriginal: boolean
  author: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  POLICY: '政策',
  FUNDING: '融资',
  EVENT: '活动',
  TECH: '技术',
  STORY: '故事',
  TOOL: '工具',
  CASE: '案例',
}

const CATEGORY_OPTIONS = [
  { value: '', label: '全部分类' },
  { value: 'POLICY', label: '政策' },
  { value: 'FUNDING', label: '融资' },
  { value: 'EVENT', label: '活动' },
  { value: 'TECH', label: '技术' },
  { value: 'STORY', label: '故事' },
  { value: 'TOOL', label: '工具' },
  { value: 'CASE', label: '案例' },
]

const ORIGINAL_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '原创' },
  { value: 'false', label: '外链' },
]

export default function AdminNewsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAuthor, setEditingAuthor] = useState<string | null>(null)
  const [authorValue, setAuthorValue] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [isOriginal, setIsOriginal] = useState('')

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'CITY_MANAGER') {
      router.replace('/admin')
    }
  }, [session, router])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 20

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (isOriginal) params.set('isOriginal', isOriginal)
      const res = await fetch(`/api/admin/news?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNewsList(data.data || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (error) {
      console.error('获取资讯失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, category, isOriginal])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  const handleOriginalChange = (val: string) => {
    setIsOriginal(val)
    setPage(1)
  }

  const handleToggleOriginal = async (item: NewsItem) => {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOriginal: !item.isOriginal }),
      })
      if (res.ok) {
        setNewsList((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, isOriginal: !n.isOriginal } : n
          )
        )
      }
    } catch (error) {
      console.error('切换原创状态失败:', error)
    }
  }

  const handleSaveAuthor = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/news/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: authorValue }),
      })
      if (res.ok) {
        setNewsList((prev) =>
          prev.map((n) =>
            n.id === itemId ? { ...n, author: authorValue } : n
          )
        )
        setEditingAuthor(null)
      }
    } catch (error) {
      console.error('更新作者失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条资讯吗？此操作不可恢复。')) return
    const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setNewsList((prev) => prev.filter((n) => n.id !== id))
      setTotal((t) => t - 1)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">资讯管理</h1>
        <Button asChild>
          <a href="/admin/news/new">+ 写原创资讯</a>
        </Button>
      </div>

      {/* 搜索 + 筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索资讯标题..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={isOriginal}
              onChange={(e) => handleOriginalChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {ORIGINAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button type="submit">搜索</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            资讯列表
            <Badge variant="outline">{total} 条</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : newsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无资讯</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">标题</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">分类</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">来源/作者</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">原创</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">发布时间</th>
                      <th className="py-3 px-4 font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsList.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 max-w-md">
                          <a
                            href={item.isOriginal ? `/news/${item.id}` : item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary line-clamp-1"
                          >
                            {item.title}
                          </a>
                          <div className="text-sm text-gray-500 line-clamp-1">{item.summary}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {editingAuthor === item.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={authorValue}
                                onChange={(e) => setAuthorValue(e.target.value)}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveAuthor(item.id)
                                  if (e.key === 'Escape') setEditingAuthor(null)
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={() => handleSaveAuthor(item.id)}>✓</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingAuthor(null)}>✗</Button>
                            </div>
                          ) : (
                            <span
                              className={item.isOriginal ? 'cursor-pointer hover:text-primary' : ''}
                              onClick={() => {
                                if (item.isOriginal) {
                                  setEditingAuthor(item.id)
                                  setAuthorValue(item.author || '')
                                }
                              }}
                              title={item.isOriginal ? '点击编辑作者' : undefined}
                            >
                              {item.author || item.source || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleOriginal(item)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              item.isOriginal
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {item.isOriginal ? '原创' : '外链'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                          {format(new Date(item.publishedAt), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {item.isOriginal && (
                              <Button size="sm" variant="ghost" asChild title="编辑">
                                <a href={`/admin/news/${item.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(item.id)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    第 {page}/{totalPages} 页，共 {total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
