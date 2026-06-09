'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Eye, EyeOff, Trash2, Pin, Star, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  content: string
  title: string | null
  type: string
  status: string
  pinned: boolean
  topics: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  // COLLAB fields
  budgetType: string | null
  budgetMin: string | null
  budgetMax: string | null
  contactType: string | null
  contactInfo: string | null
  deadline: string | null
  skills: string[]
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

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  CHAT: { label: '聊聊', color: 'bg-gray-100 text-gray-700' },
  HELP: { label: '求助', color: 'bg-orange-100 text-orange-700' },
  SHARE: { label: '分享', color: 'bg-green-100 text-green-700' },
  COLLAB: { label: '找人', color: 'bg-blue-100 text-blue-700' },
  PROGRESS: { label: '进展', color: 'bg-purple-100 text-purple-700' },
}

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'CHAT', label: '聊聊' },
  { value: 'HELP', label: '求助' },
  { value: 'SHARE', label: '分享' },
  { value: 'COLLAB', label: '找人' },
  { value: 'PROGRESS', label: '创业进展' },
]

const TOPICS = [
  { value: '', label: '全部话题' },
  { value: '创业故事', label: '#创业故事' },
  { value: '经验分享', label: '#经验分享' },
  { value: '政策解读', label: '#政策解读' },
  { value: '社区攻略', label: '#社区攻略' },
  { value: '补贴攻略', label: '#补贴攻略' },
  { value: '工具推荐', label: '#工具推荐' },
  { value: '踩坑记录', label: '#踩坑记录' },
  { value: '求助问答', label: '#求助问答' },
]

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (topicFilter) params.set('topic', topicFilter)
      if (typeFilter) params.set('type', typeFilter)

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
  }, [page, statusFilter, topicFilter, typeFilter])

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

  const handleTogglePinned = async (postId: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPinned }),
      })

      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('切换精华失败:', error)
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
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
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
                <div key={post.id} className="border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-secondary">
                          {post.author.name || post.author.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          @{post.author.username}
                        </span>
                        <Badge className={STATUS_LABELS[post.status]?.color || 'bg-gray-100'}>
                          {STATUS_LABELS[post.status]?.label || post.status}
                        </Badge>
                        {post.type && TYPE_LABELS[post.type] && (
                          <Badge className={TYPE_LABELS[post.type].color}>
                            {TYPE_LABELS[post.type].label}
                          </Badge>
                        )}
                        {post.pinned && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Pin className="h-3 w-3 mr-1" />
                            置顶
                          </Badge>
                        )}
                        {post.topics?.length > 0 && post.topics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      {post.title && (
                        <p className="font-medium text-ink mb-1">{post.title}</p>
                      )}
                      <p className="text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                      {post.type === 'COLLAB' && (post.contactInfo || post.budgetType || post.deadline) && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2 bg-blue-50 rounded px-2 py-1.5">
                          {post.contactInfo && (
                            <span>联系: {post.contactType === 'WECHAT' ? '微信' : post.contactType === 'EMAIL' ? '邮箱' : '电话'} {post.contactInfo}</span>
                          )}
                          {post.budgetType && post.budgetType !== 'NEGOTIABLE' && (
                            <span>预算: {post.budgetType === 'FIXED' ? `${post.budgetMin}元` : `${post.budgetMin || '?'}-${post.budgetMax || '?'}元`}</span>
                          )}
                          {post.budgetType === 'NEGOTIABLE' && <span>预算: 面议</span>}
                          {post.deadline && <span>截止: {post.deadline.slice(0, 10)}</span>}
                          {post.skills?.length > 0 && <span>技能: {post.skills.join(', ')}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                        <span>{post.viewCount} 浏览</span>
                        <span>{post.likeCount} 点赞</span>
                        <span>{post.commentCount} 评论</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                        title="预览内容"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title={post.pinned ? '取消精华' : '设为精华'}
                        className={post.pinned ? 'text-orange-600 hover:text-orange-700 border-orange-300' : ''}
                        onClick={() => handleTogglePinned(post.id, post.pinned)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
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
                      {post.status === 'DELETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleStatusChange(post.id, 'PUBLISHED')}
                          title="恢复发布"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {post.status !== 'DELETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {expandedId === post.id && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {post.content.slice(0, 500)}{post.content.length > 500 ? '...' : ''}
                      </div>
                    </div>
                  )}
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
