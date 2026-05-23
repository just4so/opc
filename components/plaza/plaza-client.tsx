'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  PenSquare,
  TrendingUp,
  LayoutGrid,
  List,
  MapPin,
  Send,
  Filter,
  Users,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react'
import { PostCard } from '@/components/plaza/post-card'
import { PostListItem } from '@/components/plaza/post-list-item'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  content: string
  contentHtml?: string | null
  title?: string | null
  type: string
  topics: string[]
  images: string[]
  pinned: boolean
  likeCount: number
  commentCount: number
  createdAt: string
  budgetMin?: number | null
  budgetMax?: number | null
  budgetType?: string | null
  deadline?: string | null
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

interface PlazaUser {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  location: string | null
  mainTrack: string | null
  startupStage: string | null
  verified: boolean
  verifyType: string | null
  lookingFor: string[]
  canOffer: string[]
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
    hotTopics: TopicCount[]
    activeUsers: { id: string; name: string | null; username: string; avatar: string | null; postCount: number }[]
    weekCount: number
    monthCount: number
  }
  initialPlazaUsers: PlazaUser[]
  initialPlazaUserTotal: number
}

const TYPE_TABS = [
  { value: '', label: '全部' },
  { value: 'CHAT',   label: '聊聊' },
  { value: 'HELP',   label: '求助' },
  { value: 'SHARE',  label: '分享' },
  { value: 'COLLAB', label: '找人' },
]

const LOOKING_FOR_OPTIONS = [
  '找社区入驻', '找合作伙伴', '找客户', '找投资', '找技术支持', '找曝光机会',
]

const MAIN_TAB_CARDS = 'cards'
const MAIN_TAB_POSTS = 'posts'

export function PlazaClient({
  initialPosts,
  initialTotal,
  initialStats,
  initialPlazaUsers,
  initialPlazaUserTotal,
}: PlazaClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [mainTab, setMainTab] = useState(MAIN_TAB_CARDS)

  // Posts state
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: initialTotal, totalPages: Math.ceil(initialTotal / 20),
  })
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sort, setSort] = useState('latest')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [isInitial, setIsInitial] = useState(true)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  // Card filters
  const [filterLookingFor, setFilterLookingFor] = useState('')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterCity, setFilterCity] = useState('')

  const stats = initialStats

  // Derive unique tracks and cities from plaza users
  const uniqueTracks = useMemo(() => {
    const tracks = new Set<string>()
    initialPlazaUsers.forEach(u => { if (u.mainTrack) tracks.add(u.mainTrack) })
    return Array.from(tracks).sort()
  }, [initialPlazaUsers])

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>()
    initialPlazaUsers.forEach(u => { if (u.location) cities.add(u.location) })
    return Array.from(cities).sort()
  }, [initialPlazaUsers])

  // Filter plaza users client-side
  const filteredUsers = useMemo(() => {
    return initialPlazaUsers.filter(u => {
      if (filterLookingFor && !u.lookingFor.includes(filterLookingFor)) return false
      if (filterTrack && u.mainTrack !== filterTrack) return false
      if (filterCity && u.location !== filterCity) return false
      return true
    })
  }, [initialPlazaUsers, filterLookingFor, filterTrack, filterCity])

  // Posts fetch
  useEffect(() => {
    if (isInitial) { setIsInitial(false); return }

    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
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
  }, [type, page, sort])

  useEffect(() => {
    if (!session?.user || posts.length === 0) return
    const ids = posts.map(p => p.id).join(',')
    fetch(`/api/user/liked-posts?ids=${ids}`)
      .then(res => res.json())
      .then(map => setLikedMap(map))
      .catch(() => {})
  }, [session?.user, posts])

  const handleTypeChange = (newType: string) => { setType(newType); setPage(1) }
  const handleSortChange = (newSort: string) => { setSort(newSort); setPage(1) }

  const handleContact = (user: PlazaUser) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/plaza`)
      return
    }
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: user.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.conversation?.id) {
          router.push(`/messages/${data.conversation.id}`)
        }
      })
      .catch(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-1">创业者广场</h1>
              <p className="text-slate-500 text-sm">发现创业伙伴，交流创业经验</p>
            </div>
            <Link href="/plaza/new">
              <Button size="lg" className="gap-2 shadow-sm">
                <PenSquare className="h-4 w-4" />
                发帖
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setMainTab(MAIN_TAB_CARDS)}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                mainTab === MAIN_TAB_CARDS
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              创业者卡片
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{initialPlazaUserTotal}</span>
            </button>
            <button
              onClick={() => setMainTab(MAIN_TAB_POSTS)}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                mainTab === MAIN_TAB_POSTS
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              动态
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{initialTotal}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {mainTab === MAIN_TAB_POSTS && (stats.todayStats.postCount > 0 || stats.todayStats.participantCount > 0) && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <span>今日 <strong className="text-gray-700">{stats.todayStats.postCount}</strong> 条新内容 · <strong className="text-gray-700">{stats.todayStats.participantCount}</strong> 人参与讨论</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {mainTab === MAIN_TAB_CARDS ? (
          /* ========== CARDS TAB ========== */
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterLookingFor}
                onChange={e => setFilterLookingFor(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">按需求筛选</option>
                {LOOKING_FOR_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {uniqueTracks.length > 0 && (
                <select
                  value={filterTrack}
                  onChange={e => setFilterTrack(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">按方向筛选</option>
                  {uniqueTracks.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
              {uniqueCities.length > 0 && (
                <select
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">按城市筛选</option>
                  {uniqueCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              {(filterLookingFor || filterTrack || filterCity) && (
                <button
                  onClick={() => { setFilterLookingFor(''); setFilterTrack(''); setFilterCity('') }}
                  className="text-xs text-gray-500 hover:text-primary"
                >
                  清除筛选
                </button>
              )}
            </div>

            {/* Cards grid */}
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-white rounded-2xl border hover:shadow-md transition-shadow p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || user.username}
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {user.name?.[0] || user.username[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-secondary truncate">
                            {user.name || user.username}
                          </span>
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          {user.mainTrack && <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded">{user.mainTrack}</span>}
                          {user.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{user.bio}</p>
                    )}

                    {user.lookingFor.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {user.lookingFor.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {user.canOffer.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {user.canOffer.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t">
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex-1 text-center text-sm py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        查看详情
                      </Link>
                      <button
                        onClick={() => handleContact(user)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        联系TA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">暂无匹配的创业者</p>
                <p className="text-gray-400 text-sm">试试调整筛选条件</p>
              </div>
            )}
          </div>
        ) : (
          /* ========== POSTS TAB ========== */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {stats.hotTopics.length > 0 && (
                  <div className="bg-white rounded-lg p-5 shadow-sm border-l-2 border-primary/30">
                    <h3 className="font-semibold text-secondary mb-3 text-sm">热议话题</h3>
                    <div className="space-y-2">
                      {stats.hotTopics.map((t, i) => (
                        <div
                          key={t.topic}
                          className="flex items-center justify-between text-sm cursor-pointer hover:text-primary"
                          onClick={() => handleTypeChange('')}
                        >
                          <span className="text-gray-600">
                            <span className="text-gray-400 mr-1">#{i + 1}</span>
                            {t.topic}
                          </span>
                          <span className="text-xs text-gray-400">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.activeUsers.length >= 5 && (
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <h3 className="font-semibold text-secondary mb-3 text-sm">本周活跃</h3>
                    <div className="space-y-2">
                      {stats.activeUsers.map((u) => (
                        <Link
                          key={u.id}
                          href={`/profile/${u.username}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold overflow-hidden shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.name?.[0] || u.username[0]}</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{u.name || u.username}</span>
                          <span className="ml-auto text-xs text-gray-400">{u.postCount}篇</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-secondary mb-3 text-sm">发布统计</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">本周</span>
                      <span className="font-semibold text-gray-800">{stats.weekCount}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">本月</span>
                      <span className="font-semibold text-gray-800">{stats.monthCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Post content */}
            <main className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="hidden md:flex border-b border-gray-200">
                  {TYPE_TABS.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => handleTypeChange(tab.value)}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        type === tab.value
                          ? 'text-primary border-primary'
                          : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="md:hidden px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TYPE_TABS.map(tab => (
                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="latest">最新发布</option>
                    <option value="hot">最多点赞</option>
                    <option value="comments">最多评论</option>
                  </select>

                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                viewMode === 'card' ? (
                  <div className="flex flex-col gap-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} initialLiked={!!likedMap[post.id]} />
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

              {!loading && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-md text-sm ${
                        p === pagination.page ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
