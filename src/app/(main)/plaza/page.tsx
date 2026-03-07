'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PenSquare } from 'lucide-react'
import { PostCard } from '@/components/plaza/post-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TOPICS, POST_TYPES } from '@/constants/topics'

interface Post {
  id: string
  content: string
  type: string
  topics: string[]
  images: string[]
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    level: number
    verified: boolean
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function PlazaContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || ''
  const topic = searchParams.get('topic') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (topic) params.set('topic', topic)
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
  }, [type, topic, page])

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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧筛选 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* 内容类型 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">内容类型</h3>
                <div className="space-y-2">
                  <Link
                    href="/plaza"
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      !type ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    全部
                  </Link>
                  {POST_TYPES.map((postType) => (
                    <Link
                      key={postType.id}
                      href={`/plaza?type=${postType.id}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        type === postType.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {postType.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 热门话题 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">热门话题</h3>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <Link
                      key={t.id}
                      href={`/plaza?topic=${t.id}`}
                    >
                      <Badge
                        variant={topic === t.id ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={topic === t.id ? {} : { borderColor: t.color, color: t.color }}
                      >
                        #{t.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* 右侧动态列表 */}
          <main className="lg:col-span-3 space-y-6">
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
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
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
                  <Link
                    key={p}
                    href={`/plaza?${type ? `type=${type}&` : ''}${topic ? `topic=${topic}&` : ''}page=${p}`}
                    className={`px-4 py-2 rounded-md text-sm ${
                      p === pagination.page
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function PlazaPage() {
  return (
    <Suspense fallback={null}>
      <PlazaContent />
    </Suspense>
  )
}
