'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Eye, EyeOff, Trash2, Pin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  content: string
  type: string
  status: string
  pinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-800' },
  HIDDEN: { label: '已隐藏', color: 'bg-yellow-100 text-yellow-800' },
  DELETED: { label: '已删除', color: 'bg-red-100 text-red-800' },
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/posts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('获取动态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPosts()
  }

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这条动态吗？')) return

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">动态管理</h1>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索动态内容..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button type="submit">搜索</Button>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">全部状态</option>
              <option value="PUBLISHED">已发布</option>
              <option value="HIDDEN">已隐藏</option>
              <option value="DELETED">已删除</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 动态列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            动态列表
            {pagination && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                共 {pagination.total} 条动态
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无动态</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-secondary">
                          {post.author.name || post.author.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          @{post.author.username}
                        </span>
                        <Badge className={STATUS_LABELS[post.status].color}>
                          {STATUS_LABELS[post.status].label}
                        </Badge>
                        {post.pinned && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Pin className="h-3 w-3 mr-1" />
                            置顶
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                        <span>{post.viewCount} 浏览</span>
                        <span>{post.likeCount} 点赞</span>
                        <span>{post.commentCount} 评论</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(post.id, 'HIDDEN')}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {post.status === 'HIDDEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(post.id, 'PUBLISHED')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                第 {page} / {pagination.totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
