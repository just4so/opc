'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, FileText, MapPin, User, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type SearchType = 'all' | 'post' | 'community' | 'user'

interface SearchResults {
  posts: any[]
  orders: any[]
  communities: any[]
  users: any[]
  total: {
    posts: number
    orders: number
    communities: number
    users: number
  }
}

const TABS: { id: SearchType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '全部', icon: null },
  { id: 'post', label: '动态', icon: <FileText className="h-4 w-4" /> },
  { id: 'community', label: '社区', icon: <MapPin className="h-4 w-4" /> },
  { id: 'user', label: '用户', icon: <User className="h-4 w-4" /> },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const initialType = (searchParams.get('type') as SearchType) || 'all'

  const [query, setQuery] = useState(initialQuery)
  const [activeType, setActiveType] = useState<SearchType>(initialType)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType)
    }
  }, [])

  const performSearch = async (q: string, type: SearchType) => {
    if (!q.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}&type=${activeType}`)
    performSearch(query, activeType)
  }

  const handleTypeChange = (type: SearchType) => {
    setActiveType(type)
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=${type}`)
      performSearch(query, type)
    }
  }

  const totalResults = results
    ? results.total.posts + results.total.communities + results.total.users
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* 搜索头部 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-secondary mb-6">搜索</h1>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                const val = e.target.value
                setQuery(val)
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => {
                  if (val.trim()) {
                    router.push(`/search?q=${encodeURIComponent(val)}&type=${activeType}`)
                    performSearch(val, activeType)
                  }
                }, 300)
              }}
                placeholder="搜索动态、订单、社区、用户..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '搜索中...' : '搜索'}
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 分类标签 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeType === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              {results && tab.id !== 'all' && (
                <span className="text-xs opacity-75">
                  ({results.total[tab.id === 'post' ? 'posts' : tab.id === 'community' ? 'communities' : 'users']})
                </span>
              )}
              {results && tab.id === 'all' && (
                <span className="text-xs opacity-75">({totalResults})</span>
              )}
            </button>
          ))}
        </div>

        {/* 搜索结果 */}
        {!results && !loading && (
          <div className="text-center py-16 text-gray-500">
            输入关键词开始搜索
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-500">
            搜索中...
          </div>
        )}

        {results && totalResults === 0 && (
          <div className="text-center py-16 text-gray-500">
            未找到相关结果
          </div>
        )}

        {results && totalResults > 0 && (
          <div className="space-y-8">
            {/* 动态结果 */}
            {(activeType === 'all' || activeType === 'post') && results.posts.length > 0 && (
              <section>
                {activeType === 'all' && (
                  <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    动态 ({results.total.posts})
                  </h2>
                )}
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Link href={`/profile/${post.author.username}`}>
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden">
                              {post.author.avatar ? (
                                <img src={post.author.avatar} alt={post.author.name || post.author.username} className="w-full h-full object-cover" />
                              ) : (
                                <span>{post.author.name?.[0] || post.author.username[0]}</span>
                              )}
                            </div>
                          </Link>
                          <div>
                            <Link
                              href={`/profile/${post.author.username}`}
                              className="font-medium text-secondary hover:text-primary transition-colors"
                            >
                              {post.author.name || post.author.username}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { locale: zhCN, addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <Link href={`/plaza/${post.id}`}>
                          <p className="text-gray-700 line-clamp-3 hover:text-gray-900">
                            {post.content}
                          </p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 社区结果 */}
            {(activeType === 'all' || activeType === 'community') && results.communities.length > 0 && (
              <section>
                {activeType === 'all' && (
                  <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    社区 ({results.total.communities})
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.communities.map((community) => (
                    <Link key={community.id} href={`/communities/${community.newSlug ?? community.slug}`}>
                      <Card className="h-full hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-secondary mb-1">{community.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {community.city}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 用户结果 */}
            {(activeType === 'all' || activeType === 'user') && results.users.length > 0 && (
              <section>
                {activeType === 'all' && (
                  <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    用户 ({results.total.users})
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.map((user) => (
                    <Link key={user.id} href={`/profile/${user.username}`}>
                      <Card className="h-full hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
                              ) : (
                                <span>{user.name?.[0] || user.username[0]}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-secondary truncate">
                                  {user.name || user.username}
                                </span>
                                {user.verified && (
                                  <Badge variant="secondary" className="text-xs">认证</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                              <div className="text-sm text-gray-500">Lv.{user.level}</div>
                            </div>
                          </div>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">{user.bio}</p>
                          )}
                          {user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {user.skills.slice(0, 3).map((skill: string) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-secondary mb-6">搜索</h1>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索动态、订单、社区、用户..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg"
                disabled
              />
            </div>
            <Button disabled>搜索</Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  )
}
