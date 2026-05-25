'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
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
  Package,
  X,
  Search,
  ExternalLink,
  ArrowRight,
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

interface UserProject {
  id: string
  name: string
  tagline: string
  stage: string
  website: string | null
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
  projects: UserProject[]
}

interface PlazaProject {
  id: string
  name: string
  tagline: string
  description: string | null
  stage: string
  website: string | null
  contentType: string
  owner: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    bio: string | null
    location: string | null
    verified: boolean
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
    hotTopics: TopicCount[]
    activeUsers: { id: string; name: string | null; username: string; avatar: string | null; postCount: number }[]
    weekCount: number
    monthCount: number
  }
  initialPlazaUsers: PlazaUser[]
  initialPlazaUserTotal: number
  initialProjects: PlazaProject[]
  initialProjectTotal: number
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: '想法', BUILDING: '开发中', LAUNCHED: '已上线', REVENUE: '有收入', PROFITABLE: '已盈利',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  PROJECT: '项目', DEMAND: '需求', COOPERATION: '合作',
}

const STAGE_OPTIONS = [
  { value: 'IDEA', label: '想法' },
  { value: 'BUILDING', label: '开发中' },
  { value: 'LAUNCHED', label: '已上线' },
  { value: 'REVENUE', label: '有收入' },
  { value: 'PROFITABLE', label: '已盈利' },
]

const TYPE_TABS = [
  { value: '', label: '全部' },
  { value: 'CHAT',   label: '聊聊' },
  { value: 'HELP',   label: '求助' },
  { value: 'SHARE',  label: '分享' },
  { value: 'COLLAB', label: '找人' },
]

type MainTab = 'people' | 'products' | 'posts'

function DescriptionCollapse({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = description.length > 80

  return (
    <div className="mt-1.5">
      <p className={`text-xs text-mute leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {description}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-ash hover:text-mute mt-0.5 cursor-pointer"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  )
}

export function PlazaClient({
  initialPosts,
  initialTotal,
  initialStats,
  initialPlazaUsers,
  initialPlazaUserTotal,
  initialProjects,
  initialProjectTotal,
}: PlazaClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Main tab from URL
  const tabParam = searchParams.get('tab') as MainTab | null
  const [mainTab, setMainTab] = useState<MainTab>(
    tabParam === 'products' || tabParam === 'posts' ? tabParam : 'people'
  )

  // Shared filters
  const [filterDirection, setFilterDirection] = useState(searchParams.get('direction') || '')
  const [filterCity, setFilterCity] = useState(searchParams.get('city') || '')
  const [filterStage, setFilterStage] = useState(searchParams.get('stage') || '')
  const [filterContentType, setFilterContentType] = useState(searchParams.get('contentType') || '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  // Guide banner
  const [bannerDismissed, setBannerDismissed] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('plaza-banner-dismissed')) {
      setBannerDismissed(true)
    }
  }, [])

  const dismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem('plaza-banner-dismissed', '1')
  }

  // Posts state
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [postPagination, setPostPagination] = useState<Pagination>({
    page: 1, limit: 20, total: initialTotal, totalPages: Math.ceil(initialTotal / 20),
  })
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sort, setSort] = useState('latest')
  const [type, setType] = useState('')
  const [postPage, setPostPage] = useState(1)
  const [isInitialPost, setIsInitialPost] = useState(true)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  // Products state (API-driven)
  const [projects, setProjects] = useState<PlazaProject[]>(initialProjects)
  const [projectPagination, setProjectPagination] = useState<Pagination>({
    page: 1, limit: 21, total: initialProjectTotal, totalPages: Math.ceil(initialProjectTotal / 21),
  })
  const [projectLoading, setProjectLoading] = useState(false)

  // People pagination (client-side)
  const [peoplePage, setPeoplePage] = useState(1)
  const PEOPLE_PER_PAGE = 12

  const stats = initialStats

  // Derive filter options from SSR data
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

  // URL sync
  const updateUrl = useCallback((tab: MainTab, direction: string, city: string, stage: string, search: string) => {
    const params = new URLSearchParams()
    if (tab !== 'people') params.set('tab', tab)
    if (direction) params.set('direction', direction)
    if (city) params.set('city', city)
    if (stage) params.set('stage', stage)
    if (search) params.set('search', search)
    const qs = params.toString()
    router.replace(`/plaza${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router])

  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab)
    setPeoplePage(1)
    updateUrl(tab, filterDirection, filterCity, filterStage, searchQuery)
  }

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // URL sync on filter change
  useEffect(() => {
    updateUrl(mainTab, filterDirection, filterCity, filterStage, searchQuery)
  }, [filterDirection, filterCity, filterStage, searchQuery, mainTab, updateUrl])

  // Filter people (client-side)
  const filteredUsers = useMemo(() => {
    return initialPlazaUsers.filter(u => {
      if (filterDirection && u.mainTrack !== filterDirection) return false
      if (filterCity && u.location !== filterCity) return false
      if (filterStage && u.startupStage !== filterStage) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const nameMatch = (u.name || '').toLowerCase().includes(q)
        const bioMatch = (u.bio || '').toLowerCase().includes(q)
        const trackMatch = (u.mainTrack || '').toLowerCase().includes(q)
        if (!nameMatch && !bioMatch && !trackMatch) return false
      }
      return true
    })
  }, [initialPlazaUsers, filterDirection, filterCity, filterStage, searchQuery])

  const paginatedUsers = useMemo(() => {
    const start = (peoplePage - 1) * PEOPLE_PER_PAGE
    return filteredUsers.slice(start, start + PEOPLE_PER_PAGE)
  }, [filteredUsers, peoplePage])

  const peopleTotalPages = Math.ceil(filteredUsers.length / PEOPLE_PER_PAGE)

  // Reset people page when filters change
  useEffect(() => {
    setPeoplePage(1)
  }, [filterDirection, filterCity, filterStage, searchQuery])

  // Products fetch (API-driven)
  const fetchProjects = useCallback(async (page: number) => {
    setProjectLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '21')
    if (filterDirection) params.set('direction', filterDirection)
    if (filterCity) params.set('city', filterCity)
    if (filterStage) params.set('stage', filterStage)
    if (searchQuery) params.set('search', searchQuery)
    if (filterContentType) params.set('contentType', filterContentType)

    try {
      const res = await fetch(`/api/plaza/projects?${params}`)
      const data = await res.json()
      setProjects(data.projects || [])
      setProjectPagination(data.pagination || { page: 1, limit: 21, total: 0, totalPages: 0 })
    } catch {
      // keep current state
    } finally {
      setProjectLoading(false)
    }
  }, [filterDirection, filterCity, filterStage, searchQuery, filterContentType])

  // Refetch products when filters change or tab switches to products
  const [productsFetched, setProductsFetched] = useState(false)
  useEffect(() => {
    if (mainTab === 'products') {
      fetchProjects(1)
      setProductsFetched(true)
    } else {
      setProductsFetched(false)
    }
  }, [mainTab, filterDirection, filterCity, filterStage, searchQuery, fetchProjects])

  const handleProductPageChange = (p: number) => {
    fetchProjects(p)
  }

  // Posts fetch
  useEffect(() => {
    if (isInitialPost) { setIsInitialPost(false); return }

    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (sort !== 'latest') params.set('sort', sort)
    params.set('page', String(postPage))
    params.set('limit', '20')

    fetch(`/api/posts?${params}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.data || [])
        setPostPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type, postPage, sort])

  useEffect(() => {
    if (!session?.user || posts.length === 0) return
    const ids = posts.map(p => p.id).join(',')
    fetch(`/api/user/liked-posts?ids=${ids}`)
      .then(res => res.json())
      .then(map => setLikedMap(map))
      .catch(() => {})
  }, [session?.user, posts])

  const handleTypeChange = (newType: string) => { setType(newType); setPostPage(1) }
  const handleSortChange = (newSort: string) => { setSort(newSort); setPostPage(1) }

  const handleContact = (userId: string, username: string) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/plaza`)
      return
    }
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.conversation?.id) {
          router.push(`/messages/${data.conversation.id}`)
        }
      })
      .catch(() => {})
  }

  const hasActiveFilters = filterDirection || filterCity || filterStage || searchQuery || filterContentType
  const clearAllFilters = () => {
    setFilterDirection('')
    setFilterCity('')
    setFilterStage('')
    setFilterContentType('')
    setSearchInput('')
    setSearchQuery('')
  }

  // Guide banner logic
  const userHasCard = !!(session?.user as any)?.showInPlaza
  const userProjectCount = 0 // We don't have this in session, but the banner is best-effort

  const renderBanner = () => {
    if (bannerDismissed) return null

    let text = ''
    let href = ''

    if (!session?.user) {
      text = '创建你的名片，让创业者看到你'
      href = '/register'
    } else if (!(session.user as any)?.showInPlaza) {
      text = '创建你的名片，让更多创业者看到你'
      href = '/settings#card'
    } else {
      text = '编辑我的信息'
      href = '/settings#card'
    }

    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
        <Link href={href} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
          {text}
          <ArrowRight className="h-4 w-4 animate-pulse-arrow" />
        </Link>
        <button onClick={dismissBanner} className="text-ash hover:text-mute">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <PageHeader title={<>创业者<span className="text-primary">广场</span></>} subtitle="发现创业伙伴，交流创业经验" theme="plaza">
        <Link href="/plaza/new">
          <Button size="lg" className="gap-2 shadow-sm">
            <PenSquare className="h-4 w-4" />
            发帖
          </Button>
        </Link>
      </PageHeader>

      {/* Three main tabs */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => handleTabChange('people')}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                mainTab === 'people'
                  ? 'text-primary border-primary'
                  : 'text-mute border-transparent hover:text-ink'
              }`}
            >
              <Users className="h-4 w-4" />
              伙伴
              <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">{initialPlazaUserTotal}</span>
            </button>
            <button
              onClick={() => handleTabChange('products')}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                mainTab === 'products'
                  ? 'text-primary border-primary'
                  : 'text-mute border-transparent hover:text-ink'
              }`}
            >
              <Package className="h-4 w-4" />
              产品
              <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">{initialProjectTotal}</span>
            </button>
            <button
              onClick={() => handleTabChange('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                mainTab === 'posts'
                  ? 'text-primary border-primary'
                  : 'text-mute border-transparent hover:text-ink'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              动态
              <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">{initialTotal}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar (posts tab only) */}
      {mainTab === 'posts' && (stats.todayStats.postCount > 0 || stats.todayStats.participantCount > 0) && (
        <div className="bg-canvas border-b">
          <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm text-mute">
            <TrendingUp className="h-4 w-4 text-ash" />
            <span>今日 <strong className="text-charcoal">{stats.todayStats.postCount}</strong> 条新内容 · <strong className="text-charcoal">{stats.todayStats.participantCount}</strong> 人参与讨论</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Guide banner */}
        {renderBanner()}

        {/* Filter bar (people & products tabs) */}
        {(mainTab === 'people' || mainTab === 'products') && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Filter className="h-4 w-4 text-ash hidden sm:block" />
            {uniqueTracks.length > 0 && (
              <select
                value={filterDirection}
                onChange={e => setFilterDirection(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">方向</option>
                {uniqueTracks.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            {uniqueCities.length > 0 && (
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">城市</option>
                {uniqueCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">阶段</option>
              {STAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {mainTab === 'products' && (
              <select
                value={filterContentType}
                onChange={e => setFilterContentType(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">类型</option>
                <option value="PROJECT">项目</option>
                <option value="DEMAND">需求</option>
                <option value="COOPERATION">合作</option>
              </select>
            )}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ash" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="搜索人名、产品、关键词..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-mute hover:text-primary flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}
          </div>
        )}

        {/* ========== PEOPLE TAB ========== */}
        {mainTab === 'people' && (
          <div key="people" className="tab-content-enter">
            {paginatedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedUsers.map(user => (
                  <div key={user.id} className="bg-canvas rounded-2xl border hover:shadow-md transition-shadow p-5 flex flex-col">
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
                          <span className="font-semibold text-ink truncate">
                            {user.name || user.username}
                          </span>
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-mute">
                          {user.mainTrack && <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded">{user.mainTrack}</span>}
                          {user.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </span>
                          )}
                          {user.startupStage && (
                            <span className="text-xs text-ash">{STAGE_LABELS[user.startupStage] || user.startupStage}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-body mb-3">{user.bio}</p>
                    )}

                    {/* First product only — keep card clean */}
                    {user.projects.length > 0 && (
                      <div className="flex items-center gap-2 text-xs bg-surface-soft rounded-lg px-2.5 py-2 mb-3">
                        <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-charcoal">{user.projects[0].name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t">
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex-1 text-center text-sm py-2 rounded-lg border text-mute hover:bg-surface-soft transition-colors"
                      >
                        查看主页
                      </Link>
                      <button
                        onClick={() => handleContact(user.id, user.username)}
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
              <div className="text-center py-16 bg-canvas rounded-2xl animate-float">
                <Users className="h-12 w-12 text-stone mx-auto mb-4" />
                <p className="text-mute mb-2">没有找到匹配的结果</p>
                <p className="text-ash text-sm">试试调整筛选条件</p>
              </div>
            )}

            {/* People pagination */}
            {peopleTotalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: peopleTotalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeoplePage(p)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      p === peoplePage ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-card'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== PRODUCTS TAB ========== */}
        {mainTab === 'products' && (
          <div key="products" className="tab-content-enter">
            {projectLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-canvas rounded-2xl border p-5">
                    <div className="h-5 w-3/4 bg-secondary-bg rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-secondary-bg rounded animate-pulse mb-4" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-secondary-bg rounded-full animate-pulse" />
                      <div className="h-4 w-24 bg-secondary-bg rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map(proj => (
                  <div key={proj.id} className="bg-canvas rounded-2xl border hover:shadow-md transition-shadow p-5 flex flex-col">
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-ink leading-snug">{proj.name}</h3>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary shrink-0 mt-0.5">
                          {STAGE_LABELS[proj.stage] || proj.stage}
                        </span>
                      </div>
                      <p className="text-sm text-body leading-relaxed">{proj.tagline}</p>
                      {proj.description && proj.description !== proj.tagline && (
                        <DescriptionCollapse description={proj.description} />
                      )}
                    </div>

                    {/* Owner info */}
                    <div className="flex items-center gap-2 mb-3 mt-auto">
                      {proj.owner.avatar ? (
                        <img src={proj.owner.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {proj.owner.name?.[0] || proj.owner.username[0]}
                        </div>
                      )}
                      <span className="text-sm text-charcoal truncate">{proj.owner.name || proj.owner.username}</span>
                      {proj.owner.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                      {proj.owner.location && (
                        <span className="text-xs text-ash flex items-center gap-0.5 ml-auto">
                          <MapPin className="h-3 w-3" />
                          {proj.owner.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      {proj.website ? (
                        <a
                          href={proj.website.startsWith('http') ? proj.website : `https://${proj.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border text-mute hover:bg-surface-soft transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          访问网站
                        </a>
                      ) : (
                        <Link
                          href={`/profile/${proj.owner.username}`}
                          className="flex-1 text-center text-sm py-2 rounded-lg border text-mute hover:bg-surface-soft transition-colors"
                        >
                          了解更多
                        </Link>
                      )}
                      <button
                        onClick={() => handleContact(proj.owner.id, proj.owner.username)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        联系创始人
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-canvas rounded-2xl animate-float">
                <Package className="h-12 w-12 text-stone mx-auto mb-4" />
                <p className="text-mute mb-2">没有找到匹配的结果</p>
                <p className="text-ash text-sm">试试调整筛选条件</p>
              </div>
            )}

            {/* Products pagination */}
            {!projectLoading && projectPagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: projectPagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProductPageChange(p)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      p === projectPagination.page ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-card'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== POSTS TAB ========== */}
        {mainTab === 'posts' && (
          <div key="posts" className="grid grid-cols-1 lg:grid-cols-4 gap-8 tab-content-enter">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {stats.hotTopics.length > 0 && (
                  <div className="bg-canvas rounded-2xl p-5 shadow-soft border-l-2 border-primary/30">
                    <h3 className="font-semibold text-ink mb-3 text-sm">热议话题</h3>
                    <div className="space-y-2">
                      {stats.hotTopics.map((t, i) => (
                        <div
                          key={t.topic}
                          className="flex items-center justify-between text-sm cursor-pointer hover:text-primary"
                          onClick={() => handleTypeChange('')}
                        >
                          <span className="text-mute">
                            <span className="text-ash mr-1">#{i + 1}</span>
                            {t.topic}
                          </span>
                          <span className="text-xs text-ash">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.activeUsers.length >= 5 && (
                  <div className="bg-canvas rounded-2xl p-5 shadow-soft">
                    <h3 className="font-semibold text-ink mb-3 text-sm">本周活跃</h3>
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
                          <span className="text-sm text-charcoal truncate">{u.name || u.username}</span>
                          <span className="ml-auto text-xs text-ash">{u.postCount}篇</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-canvas rounded-2xl p-5 shadow-soft">
                  <h3 className="font-semibold text-ink mb-3 text-sm">发布统计</h3>
                  <div className="flex items-center gap-4 text-sm text-mute">
                    <div className="flex items-center gap-1">
                      <span className="text-ash">本周</span>
                      <span className="font-semibold text-ink">{stats.weekCount}</span>
                    </div>
                    <div className="w-px h-3 bg-secondary-bg" />
                    <div className="flex items-center gap-1">
                      <span className="text-ash">本月</span>
                      <span className="font-semibold text-ink">{stats.monthCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Post content */}
            <main className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="hidden md:flex border-b border-hairline-soft">
                  {TYPE_TABS.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => handleTypeChange(tab.value)}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        type === tab.value
                          ? 'text-primary border-primary'
                          : 'text-mute border-transparent hover:text-ink hover:border-hairline'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="md:hidden px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TYPE_TABS.map(tab => (
                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-lg bg-canvas text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="latest">最新发布</option>
                    <option value="hot">最多点赞</option>
                    <option value="comments">最多评论</option>
                  </select>

                  <div className="flex rounded-lg border border-hairline-soft overflow-hidden text-sm">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        viewMode === 'card' ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-soft'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        viewMode === 'list' ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-soft'
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
                    <div key={i} className="bg-canvas rounded-xl p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-secondary-bg rounded-full animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-secondary-bg rounded animate-pulse mb-2" />
                          <div className="h-5 w-full bg-secondary-bg rounded animate-pulse mb-2" />
                          <div className="h-4 w-3/4 bg-secondary-bg rounded animate-pulse mb-4" />
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
                  <div className="bg-canvas rounded-xl border overflow-hidden">
                    {posts.map((post) => (
                      <PostListItem key={post.id} post={post} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-16 bg-canvas rounded-2xl">
                  <p className="text-mute mb-4">暂无动态</p>
                  <Link href="/plaza/new">
                    <Button>发布第一条动态</Button>
                  </Link>
                </div>
              )}

              {!loading && postPagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: postPagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPostPage(p)}
                      className={`px-4 py-2 rounded-md text-sm ${
                        p === postPagination.page ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-card'
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
