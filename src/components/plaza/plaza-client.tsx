'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PenSquare, TrendingUp, LayoutGrid, List } from 'lucide-react'
import { PostCard } from '@/components/plaza/post-card'
import { PostListItem } from '@/components/plaza/post-list-item'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TOPICS, POST_TYPES } from '@/constants/topics'

interface Post {
  id: string
  content: string
  type: string
  topics: string[]
  images: string[]
  pinned: boolean
  likeCount: number
  commentCount: number
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    level: number
    verified: boolean
    location?: string | null
    mainTrack?: string | null
    startupStage?: string | null
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface TodayStats {
  postCount: number
  participantCount: number
}

interface TopicCount {
  topic: string
  count: number
}

export interface PlazaClientProps {
  initialPosts: Post[]
  initialTotal: number
  initialStats: {
    todayStats: TodayStats
    topicCounts: TopicCount[]
  }
}

export function PlazaClient({ initialPosts, initialTotal, initialStats }: PlazaClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: initialTotal,
    totalPages: Math.ceil(initialTotal / 20),
  })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'featured' | 'all'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sort, setSort] = useState('latest')
  const [type, setType] = useState('')
  const [topic, setTopic] = useState('')
  const [page, setPage] = useState(1)
  const [todayStats, setTodayStats] = useState<TodayStats>(initialStats.todayStats)
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>(initialStats.topicCounts)

  // Track whether this is the initial render (skip fetch on mount)
  const [isInitial, setIsInitial] = useState(true)

  // Fetch posts when filters change (skip initial render since we have SSR data)
  useEffect(() => {
    if (isInitial) {
      setIsInitial(false)
      return
    }

    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (topic) params.set('topic', topic)
    if (tab === 'featured') params.set('pinned', 'true')
    if (sort !== 'latest') params.set('sort', sort)
    params.set('page', String(page))
    params.set('limit', '20')

    fetch(`/api/posts?${params}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type, topic, page, tab, sort])

  const handleTypeChange = (newType: string) => {
    setType(newType)
    setPage(1)
  }

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic === topic ? '' : newTopic)
    setPage(1)
  }

  const handleTabChange = (newTab: 'featured' | 'all') => {
    setTab(newTab)
    setPage(1)
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">创业广场</h1>
              <p className="text-gray-600">
                分享你的创业故事，与志同道合的创业者交流互动
              </p>
            </div>
            <Link href="/plaza/new">
              <Button>
                <PenSquare className="h-4 w-4 mr-2" />
                发布动态
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 今日活跃统计条 */}
      {(todayStats.postCount > 0 || todayStats.participantCount > 0) && (
        <div className="bg-orange-50 border-b">
          <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            <span>今日 <strong className="text-gray-700">{todayStats.postCount}</strong> 条新内容 · <strong className="text-gray-700">{todayStats.participantCount}</strong> 人参与讨论</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧筛选 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* 内容类型 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">内容类型</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTypeChange('')}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !type ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    全部
                  </button>
                  {POST_TYPES.map((postType) => (
                    <button
                      key={postType.id}
                      onClick={() => handleTypeChange(postType.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        type === postType.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {postType.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 热门话题 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">热门话题</h3>
                <div className="flex flex-wrap gap-2">
                  {(topicCounts.length > 0
                    ? topicCounts
                        .filter(tc => tc.count > 0)
                        .map(tc => {
                          const t = TOPICS.find(tp => tp.id === tc.topic)
                          return t ? { ...t, count: tc.count } : null
                        })
                        .filter(Boolean) as (typeof TOPICS[number] & { count: number })[]
                    : TOPICS.map(t => ({ ...t, count: 0 }))
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTopicChange(t.id)}
                    >
                      <Badge
                        variant={topic === t.id ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={topic === t.id ? {} : { borderColor: t.color, color: t.color }}
                      >
                        #{t.name}{t.count > 0 ? ` (${t.count})` : ''}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* 右侧动态列表 */}
          <main className="lg:col-span-3 space-y-6">
            {/* 精华/全部 Tab + 排序 + 视图切换 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleTabChange('featured')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      tab === 'featured'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    精华
                  </button>
                  <button
                    onClick={() => handleTabChange('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      tab === 'all'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    全部
                  </button>
                </div>

                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="latest">最新发布</option>
                  <option value="hot">最多点赞</option>
                  <option value="comments">最多评论</option>
                </select>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'card'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="卡片视图"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="列表视图"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
                        <div className="flex gap-4">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                  {posts.map((post) => (
                    <PostListItem key={post.id} post={post} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 bg-white rounded-lg">
                <p className="text-gray-500 mb-4">暂无动态</p>
                <Link href="/plaza/new">
                  <Button>发布第一条动态</Button>
                </Link>
              </div>
            )}

            {/* 分页 */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      p === pagination.page
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
