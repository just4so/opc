'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  PenSquare,
  LayoutGrid,
  List,
  Filter,
  Users,
  MessageCircle,
  Package,
  X,
  Search,
  ArrowRight,
} from 'lucide-react'
import { PostCard } from '@/components/plaza/post-card'
import { PostListItem } from '@/components/plaza/post-list-item'
import { OnboardingRecommendations } from '@/components/plaza/onboarding-recommendations'
import { ProductCard } from '@/components/plaza/product-card'
import { PersonCard } from '@/components/plaza/person-card'
import { NotificationTicker } from '@/components/plaza/notification-ticker'
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
  milestone?: string | null
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
  slug: string
  description: string
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
  followerCount: number
  projectCount: number
  projects: UserProject[]
}

interface PlazaProject {
  id: string
  slug: string
  name: string
  description: string | null
  images: string[]
  stage: string
  website: string | null
  contentType: string
  commentCount: number
  likeCount: number
  createdAt: string | Date
  progress?: { createdAt: string | Date }[]
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

export interface PlazaClientProps {
  initialPlazaUsers: PlazaUser[]
  initialPlazaUserTotal: number
  initialProjects: PlazaProject[]
  initialProjectTotal: number
  tickerEvents?: { text: string; time: string; link: string }[]
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
  { value: '',       label: '全部' },
  { value: 'SHARE',  label: '分享' },
  { value: 'DEMAND', label: '发需求' },
  { value: 'CHAT',   label: '随便聊' },
]

type MainTab = 'people' | 'products' | 'posts'

export function PlazaClient({
  initialPlazaUsers,
  initialPlazaUserTotal,
  initialProjects,
  initialProjectTotal,
  tickerEvents,
}: PlazaClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Main tab from URL
  const tabParam = searchParams.get('tab') as MainTab | null
  const [mainTab, setMainTab] = useState<MainTab>(
    tabParam === 'people' || tabParam === 'posts' ? tabParam : 'products'
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

  // Posts state — 客户端按需加载，初始为空
  const [posts, setPosts] = useState<Post[]>([])
  const [postPagination, setPostPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest')
  const [productSort, setProductSort] = useState(searchParams.get('sort') || 'latest')
  const [peopleSort, setPeopleSort] = useState(searchParams.get('sort') || 'latest')
  const [type, setType] = useState('')
  const [postPage, setPostPage] = useState(1)
  const [postsFetched, setPostsFetched] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  // Onboarding — 客户端异步判断，已完成 onboarding 的用户不感知
  const [onboardingData, setOnboardingData] = useState<{
    userId: string
    mainTrack: string | null
    location: string | null
  } | null>(null)
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/user/onboarding-status')
      .then(res => res.json())
      .then(data => {
        if (!data.completed) {
          setOnboardingData({ userId: data.userId, mainTrack: data.mainTrack, location: data.location })
        }
      })
      .catch(() => {})
  }, [session?.user])

  // Follow status for people tab
  const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({})

  // Like status for products tab
  const [projectLikedMap, setProjectLikedMap] = useState<Record<string, boolean>>({})

  // Products state (API-driven)
  const [projects, setProjects] = useState<PlazaProject[]>(initialProjects)
  const [projectPagination, setProjectPagination] = useState<Pagination>({
    page: 1, limit: 21, total: initialProjectTotal, totalPages: Math.ceil(initialProjectTotal / 21),
  })
  const [projectLoading, setProjectLoading] = useState(false)

  // People state (API-driven)
  const [people, setPeople] = useState<PlazaUser[]>(initialPlazaUsers)
  const [peoplePagination, setPeoplePagination] = useState({
    page: 1,
    limit: 12,
    total: initialPlazaUserTotal,
    totalPages: Math.ceil(initialPlazaUserTotal / 12),
  })
  const [peopleLoading, setPeopleLoading] = useState(false)

  // Filter options derived from SSR data
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
  const updateUrl = useCallback((tab: MainTab, direction: string, city: string, stage: string, search: string, sortVal?: string) => {
    const params = new URLSearchParams()
    if (tab !== 'products') params.set('tab', tab)
    if (direction) params.set('direction', direction)
    if (city) params.set('city', city)
    if (stage) params.set('stage', stage)
    if (search) params.set('search', search)
    if (sortVal && sortVal !== 'latest') params.set('sort', sortVal)
    const qs = params.toString()
    router.replace(`/plaza${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router])

  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab)
    const sortVal = tab === 'products' ? productSort : tab === 'posts' ? sort : peopleSort
    updateUrl(tab, filterDirection, filterCity, filterStage, searchQuery, sortVal)
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
    const sortVal = mainTab === 'products' ? productSort : mainTab === 'posts' ? sort : peopleSort
    updateUrl(mainTab, filterDirection, filterCity, filterStage, searchQuery, sortVal)
  }, [filterDirection, filterCity, filterStage, searchQuery, mainTab, updateUrl, productSort, sort, peopleSort])

  // Batch fetch follow status for displayed people
  useEffect(() => {
    if (mainTab !== 'people' || !session?.user) return
    const ids = people.map(u => u.id).join(',')
    if (!ids) return
    fetch(`/api/user/following-status?ids=${ids}`)
      .then(res => res.json())
      .then(data => setFollowStatusMap(prev => ({ ...prev, ...data.statuses })))
      .catch(() => {})
  }, [mainTab, people, session?.user])

  // Batch fetch liked status for displayed projects
  useEffect(() => {
    if (mainTab !== 'products' || !session?.user) return
    const ids = projects.map(p => p.id).join(',')
    if (!ids) return
    fetch(`/api/user/liked-projects?ids=${ids}`)
      .then(res => res.json())
      .then(data => setProjectLikedMap(prev => ({ ...prev, ...data })))
      .catch(() => {})
  }, [mainTab, projects, session?.user])

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
    if (productSort !== 'latest') params.set('sort', productSort)

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
  }, [filterDirection, filterCity, filterStage, searchQuery, filterContentType, productSort])

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

  // People fetch (API-driven)
  const fetchUsers = useCallback(async (page: number) => {
    setPeopleLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '12')
    if (filterCity) params.set('location', filterCity)
    if (filterDirection) params.set('mainTrack', filterDirection)
    if (filterStage) params.set('stage', filterStage)
    if (searchQuery) params.set('search', searchQuery)
    if (peopleSort === 'followers') params.set('sort', 'followers')
    try {
      const res = await fetch(`/api/plaza/users?${params}`)
      const data = await res.json()
      setPeople(data.users || [])
      setPeoplePagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
    } finally {
      setPeopleLoading(false)
    }
  }, [filterCity, filterDirection, filterStage, searchQuery, peopleSort])

  useEffect(() => {
    if (mainTab !== 'people') return
    fetchUsers(1)
  }, [mainTab, filterCity, filterDirection, filterStage, searchQuery, peopleSort, fetchUsers])

  const handlePeoplePage = (p: number) => {
    fetchUsers(p)
  }

  // Posts fetch — 切到 posts tab 时才加载，过滤/翻页时重新拉取
  useEffect(() => {
    if (mainTab !== 'posts') return

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
        setPostsFetched(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [mainTab, type, postPage, sort])

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
  const handleProductSortChange = (newSort: string) => { setProductSort(newSort) }
  const handlePeopleSortChange = (newSort: string) => { setPeopleSort(newSort) }

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
        <div className="flex gap-3">
          <Link href="/settings#products">
            <Button size="lg" variant="outline" className="gap-2 active:scale-[0.98] transition-transform">
              <Package className="h-4 w-4" />
              发布产品
            </Button>
          </Link>
          <Link href="/plaza/new">
            <Button size="lg" className="gap-2 shadow-sm">
              <PenSquare className="h-4 w-4" />
              发帖
            </Button>
          </Link>
        </div>
      </PageHeader>

      <NotificationTicker events={tickerEvents || []} />

      {/* Three main tabs */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <button
              onClick={() => handleTabChange('products')}
              className={`px-3 sm:px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 sm:gap-2 ${
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
              onClick={() => handleTabChange('people')}
              className={`px-3 sm:px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 sm:gap-2 ${
                mainTab === 'people'
                  ? 'text-primary border-primary'
                  : 'text-mute border-transparent hover:text-ink'
              }`}
            >
              <Users className="h-4 w-4" />
              创业者
              <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">{initialPlazaUserTotal}</span>
            </button>
            <button
              onClick={() => handleTabChange('posts')}
              className={`px-3 sm:px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 sm:gap-2 ${
                mainTab === 'posts'
                  ? 'text-primary border-primary'
                  : 'text-mute border-transparent hover:text-ink'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              动态
              <span className="text-xs bg-surface-card text-mute px-1.5 py-0.5 rounded-full">{postPagination.total > 0 ? postPagination.total : ''}</span>
            </button>
            <div className="ml-auto">
              <select
                value={mainTab === 'products' ? productSort : mainTab === 'posts' ? sort : peopleSort}
                onChange={(e) => {
                  if (mainTab === 'products') handleProductSortChange(e.target.value)
                  else if (mainTab === 'posts') handleSortChange(e.target.value)
                  else handlePeopleSortChange(e.target.value)
                }}
                className="text-sm text-mute bg-transparent border-0 focus:ring-0 cursor-pointer"
              >
                {mainTab === 'products' && (
                  <>
                    <option value="latest">最新发布</option>
                    <option value="likes">最多喜欢</option>
                    <option value="updated">最近更新</option>
                  </>
                )}
                {mainTab === 'posts' && (
                  <>
                    <option value="latest">最新发布</option>
                    <option value="hot">最多互动</option>
                    <option value="likes">最多点赞</option>
                    <option value="comments">最多评论</option>
                  </>
                )}
                {mainTab === 'people' && (
                  <>
                    <option value="latest">最新加入</option>
                    <option value="followers">最多粉丝</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      
      <div className="container mx-auto px-4 py-8">
        {/* Guide banner */}
        {renderBanner()}

        {/* Onboarding recommendations for new users */}
        {onboardingData && (
          <OnboardingRecommendations
            currentUserId={onboardingData.userId}
            currentUserTrack={onboardingData.mainTrack}
            currentUserLocation={onboardingData.location}
          />
        )}

        {/* Filter bar */}
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
            {mainTab === 'people' && uniqueCities.length > 0 && (
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
            {mainTab === 'people' && (
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
            )}
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
            {peopleLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-canvas rounded-2xl border p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-secondary-bg rounded-full animate-pulse" />
                      <div>
                        <div className="h-4 w-24 bg-secondary-bg rounded animate-pulse mb-1" />
                        <div className="h-3 w-16 bg-secondary-bg rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-secondary-bg rounded animate-pulse mb-2" />
                    <div className="h-4 w-3/4 bg-secondary-bg rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : people.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {people.map(user => (
                  <PersonCard
                    key={user.id}
                    user={{
                      id: user.id,
                      name: user.name,
                      username: user.username,
                      avatar: user.avatar,
                      city: user.location,
                      mainTrack: user.mainTrack,
                      bio: user.bio,
                      followerCount: user.followerCount ?? 0,
                      projectCount: user.projectCount ?? 0,
                      projects: user.projects.map(p => ({ slug: p.slug, name: p.name })),
                      isVerified: user.verified,
                    }}
                    isFollowing={!!followStatusMap[user.id]}
                    onFollowChange={(userId, following) => {
                      setFollowStatusMap(prev => ({ ...prev, [userId]: following }))
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-canvas rounded-2xl">
                <Users className="h-12 w-12 text-ash mx-auto mb-4" />
                <p className="text-ink font-medium mb-1">没有找到匹配的结果</p>
                <p className="text-mute text-sm mb-4">试试调整筛选条件，或清除全部筛选重新浏览</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  清除全部筛选
                </button>
              </div>
            )}

            {/* People pagination */}
            {!peopleLoading && peoplePagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: peoplePagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeoplePage(p)}
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      p === peoplePagination.page ? 'bg-primary text-white' : 'bg-canvas text-mute hover:bg-surface-card'
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(proj => (
                  <ProductCard
                    key={proj.id}
                    project={{
                      id: proj.id,
                      slug: proj.slug,
                      name: proj.name,
                      description: proj.description,
                      images: proj.images || [],
                      stage: proj.stage,
                      website: proj.website,
                      likeCount: proj.likeCount,
                      commentCount: proj.commentCount,
                      owner: {
                        id: proj.owner.id,
                        name: proj.owner.name,
                        username: proj.owner.username,
                        avatar: proj.owner.avatar,
                        city: proj.owner.location,
                      },
                    }}
                    latestProgressAt={proj.progress?.[0]?.createdAt ?? proj.createdAt}
                    hasProgress={!!proj.progress?.[0]}
                    isLiked={!!projectLikedMap[proj.id]}
                    onLikeChange={(projectId, liked) => {
                      setProjectLikedMap(prev => ({ ...prev, [projectId]: liked }))
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-canvas rounded-2xl">
                <Package className="h-12 w-12 text-ash mx-auto mb-4" />
                <p className="text-ink font-medium mb-1">没有找到匹配的结果</p>
                <p className="text-mute text-sm mb-4">试试调整筛选条件，或清除全部筛选重新浏览</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  清除全部筛选
                </button>
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
          <div key="posts" className="tab-content-enter">
            {/* Post content */}
            <main className="space-y-6">
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
