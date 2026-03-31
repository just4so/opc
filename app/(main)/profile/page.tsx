'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Mail,
  MapPin,
  Globe,
  Calendar,
  Settings,
  Award,
  Trash2,
  ChevronDown,
  FileText,
  Briefcase,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  username: string
  email: string | null
  name: string | null
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  level: number
  verified: boolean
  verifyType: string | null
  skills: string[]
  canOffer: string[]
  lookingFor: string[]
  createdAt: string
  _count: { posts: number }
}

interface UserPost {
  id: string
  title: string | null
  content: string
  type: string
  likeCount: number
  commentCount: number
  status: string
  createdAt: string
}

interface UserComment {
  id: string
  content: string
  createdAt: string
  post: { id: string; content: string; title: string | null } | null
}

interface PostSummary {
  id: string
  title: string | null
  content: string
  type: string
  likeCount: number
  commentCount: number
  createdAt: string
  author: { id: string; username: string; name: string | null; avatar: string | null; level: number; verified: boolean }
}

interface FavoriteItem {
  id: string
  createdAt: string
  post: PostSummary | null
}

interface LikeItem {
  id: string
  createdAt: string
  post: PostSummary | null
}

const TYPE_LABELS: Record<string, string> = {
  CHAT: '💬 聊聊', HELP: '❓ 求助', SHARE: '📣 分享', COLLAB: '🤝 找人',
  DAILY: '📝 日常', EXPERIENCE: '💡 经验', QUESTION: '❓ 提问',
  RESOURCE: '📦 资源', DISCUSSION: '💬 讨论',
}

const TABS = ['我的帖子', '我的评论', '我的点赞', '我的收藏'] as const
type TabKey = typeof TABS[number]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('我的帖子')

  const [postsData, setPostsData] = useState<UserPost[]>([])
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsPage, setPostsPage] = useState(1)
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)

  const [commentsData, setCommentsData] = useState<UserComment[]>([])
  const [commentsTotal, setCommentsTotal] = useState(0)
  const [commentsPage, setCommentsPage] = useState(1)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)

  const [likesData, setLikesData] = useState<LikeItem[]>([])
  const [likesTotal, setLikesTotal] = useState(0)
  const [likesPage, setLikesPage] = useState(1)
  const [likesLoaded, setLikesLoaded] = useState(false)
  const [likesLoading, setLikesLoading] = useState(false)

  const [favoritesData, setFavoritesData] = useState<FavoriteItem[]>([])
  const [favoritesTotal, setFavoritesTotal] = useState(0)
  const [favoritesPage, setFavoritesPage] = useState(1)
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/user/profile').then(r => r.json()).then(setUser).finally(() => setLoading(false))
    }
  }, [status, router])

  const loadPosts = useCallback(async (page: number) => {
    setPostsLoading(true)
    const res = await fetch(`/api/user/posts?page=${page}`)
    const data = await res.json()
    setPostsData(prev => page === 1 ? data.data : [...prev, ...data.data])
    setPostsTotal(data.total)
    setPostsPage(page)
    setPostsLoaded(true)
    setPostsLoading(false)
  }, [])

  const loadComments = useCallback(async (page: number) => {
    setCommentsLoading(true)
    const res = await fetch(`/api/user/comments?page=${page}`)
    const data = await res.json()
    setCommentsData(prev => page === 1 ? data.data : [...prev, ...data.data])
    setCommentsTotal(data.total)
    setCommentsPage(page)
    setCommentsLoaded(true)
    setCommentsLoading(false)
  }, [])

  const loadLikes = useCallback(async (page: number) => {
    setLikesLoading(true)
    const res = await fetch(`/api/user/likes?page=${page}`)
    const data = await res.json()
    setLikesData(prev => page === 1 ? data.data : [...prev, ...data.data])
    setLikesTotal(data.total)
    setLikesPage(page)
    setLikesLoaded(true)
    setLikesLoading(false)
  }, [])

  const loadFavorites = useCallback(async (page: number) => {
    setFavoritesLoading(true)
    const res = await fetch(`/api/user/favorites?page=${page}`)
    const data = await res.json()
    setFavoritesData(prev => page === 1 ? data.data : [...prev, ...data.data])
    setFavoritesTotal(data.total)
    setFavoritesPage(page)
    setFavoritesLoaded(true)
    setFavoritesLoading(false)
  }, [])

  useEffect(() => {
    if (!session?.user) return
    if (activeTab === '我的帖子' && !postsLoaded) loadPosts(1)
    if (activeTab === '我的评论' && !commentsLoaded) loadComments(1)
    if (activeTab === '我的点赞' && !likesLoaded) loadLikes(1)
    if (activeTab === '我的收藏' && !favoritesLoaded) loadFavorites(1)
  }, [activeTab, session, postsLoaded, commentsLoaded, likesLoaded, favoritesLoaded, loadPosts, loadComments, loadLikes, loadFavorites])

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('确定删除这条帖子？删除后不可恢复')) return
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPostsData(prev => prev.filter(p => p.id !== postId))
      setPostsTotal(prev => prev - 1)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('确定删除这条评论？')) return
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setCommentsData(prev => prev.filter(c => c.id !== commentId))
      setCommentsTotal(prev => prev - 1)
    }
  }

  const handleUnfavorite = async (favoriteId: string, postId: string) => {
    if (!window.confirm('确定取消收藏？')) return
    const res = await fetch(`/api/posts/${postId}/favorite`, { method: 'POST' })
    if (res.ok) {
      setFavoritesData(prev => prev.filter(f => f.id !== favoriteId))
      setFavoritesTotal(prev => prev - 1)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">用户信息加载失败</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary">个人中心</h1>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：用户信息卡片 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name?.[0] || user.username[0]}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-secondary">{user.name || user.username}</h2>
                  <p className="text-gray-500">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Lv.{user.level}</Badge>
                    {user.verified && (
                      <Badge variant="default">
                        <Award className="h-3 w-3 mr-1" />
                        已认证
                      </Badge>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-gray-600 text-center mt-4 text-sm">{user.bio}</p>
                )}

                <div className="mt-6 space-y-3">
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {user.location}
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')} 加入
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user._count.posts}</div>
                  <div className="text-sm text-gray-500">动态</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/plaza/new">
                    <Button variant="outline" className="w-full text-sm">
                      <FileText className="h-4 w-4 mr-1.5" />
                      发布动态
                    </Button>
                  </Link>
                  <Link href="/market/new">
                    <Button variant="outline" className="w-full text-sm">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      发布需求
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：Tab 内容管理 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab 导航 */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'text-primary border-primary'
                        : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 我的帖子 */}
            {activeTab === '我的帖子' && (
              <div className="space-y-3">
                {postsLoading && postsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : postsData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="mb-3">还没有发布任何帖子</p>
                    <Link href="/plaza/new"><Button size="sm">发布第一条</Button></Link>
                  </div>
                ) : (
                  postsData.map(post => (
                    <Card key={post.id} className="rounded-xl">
                      <CardContent className="py-4 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {TYPE_LABELS[post.type] && (
                                <span className="text-xs text-gray-500">{TYPE_LABELS[post.type]}</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { locale: zhCN, addSuffix: true })}
                              </span>
                            </div>
                            {post.title && (
                              <Link href={`/plaza/${post.id}`}>
                                <p className="font-medium text-gray-900 text-sm hover:text-primary truncate">{post.title}</p>
                              </Link>
                            )}
                            <Link href={`/plaza/${post.id}`}>
                              <p className="text-gray-600 text-sm line-clamp-2 hover:text-gray-900">
                                {post.content.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\[\]]/g, '').slice(0, 120)}
                              </p>
                            </Link>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                              <span>❤️ {post.likeCount}</span>
                              <span>💬 {post.commentCount}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                {postsData.length < postsTotal && (
                  <button
                    onClick={() => loadPosts(postsPage + 1)}
                    disabled={postsLoading}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                    加载更多 ({postsData.length}/{postsTotal})
                  </button>
                )}
              </div>
            )}

            {/* 我的评论 */}
            {activeTab === '我的评论' && (
              <div className="space-y-3">
                {commentsLoading && commentsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : commentsData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">还没有发布过评论</div>
                ) : (
                  commentsData.map(comment => (
                    <Card key={comment.id} className="rounded-xl">
                      <CardContent className="py-4 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 text-sm mb-1.5">{comment.content}</p>
                            {comment.post && (
                              <Link href={`/plaza/${comment.post.id}`} className="text-xs text-gray-400 hover:text-primary">
                                ↗ {comment.post.title || comment.post.content.slice(0, 40)}...
                              </Link>
                            )}
                            <div className="mt-1 text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { locale: zhCN, addSuffix: true })}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                {commentsData.length < commentsTotal && (
                  <button
                    onClick={() => loadComments(commentsPage + 1)}
                    disabled={commentsLoading}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                    加载更多 ({commentsData.length}/{commentsTotal})
                  </button>
                )}
              </div>
            )}

            {/* 我的点赞 */}
            {activeTab === '我的点赞' && (
              <div className="space-y-3">
                {likesLoading && likesData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : likesData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">还没有点赞过任何帖子</div>
                ) : (
                  likesData.filter(l => l.post).map(like => (
                    <Card key={like.id} className="rounded-xl">
                      <CardContent className="py-4 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          {TYPE_LABELS[like.post!.type] && (
                            <span className="text-xs text-gray-500">{TYPE_LABELS[like.post!.type]}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(like.post!.createdAt), { locale: zhCN, addSuffix: true })}
                          </span>
                        </div>
                        {like.post!.title && (
                          <Link href={`/plaza/${like.post!.id}`}>
                            <p className="font-medium text-gray-900 text-sm hover:text-primary truncate">{like.post!.title}</p>
                          </Link>
                        )}
                        <Link href={`/plaza/${like.post!.id}`}>
                          <p className="text-gray-600 text-sm line-clamp-2 hover:text-gray-900">
                            {like.post!.content.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\[\]]/g, '').slice(0, 120)}
                          </p>
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span>by @{like.post!.author.username}</span>
                          <span>❤️ {like.post!.likeCount}</span>
                          <span>💬 {like.post!.commentCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                {likesData.length < likesTotal && (
                  <button
                    onClick={() => loadLikes(likesPage + 1)}
                    disabled={likesLoading}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                    加载更多 ({likesData.length}/{likesTotal})
                  </button>
                )}
              </div>
            )}

            {/* 我的收藏 */}
            {activeTab === '我的收藏' && (
              <div className="space-y-3">
                {favoritesLoading && favoritesData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : favoritesData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">还没有收藏过任何帖子</div>
                ) : (
                  favoritesData.filter(f => f.post).map(fav => (
                    <Card key={fav.id} className="rounded-xl">
                      <CardContent className="py-4 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {TYPE_LABELS[fav.post!.type] && (
                                <span className="text-xs text-gray-500">{TYPE_LABELS[fav.post!.type]}</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(fav.post!.createdAt), { locale: zhCN, addSuffix: true })}
                              </span>
                            </div>
                            {fav.post!.title && (
                              <Link href={`/plaza/${fav.post!.id}`}>
                                <p className="font-medium text-gray-900 text-sm hover:text-primary truncate">{fav.post!.title}</p>
                              </Link>
                            )}
                            <Link href={`/plaza/${fav.post!.id}`}>
                              <p className="text-gray-600 text-sm line-clamp-2 hover:text-gray-900">
                                {fav.post!.content.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\[\]]/g, '').slice(0, 120)}
                              </p>
                            </Link>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                              <span>by @{fav.post!.author.username}</span>
                              <span>❤️ {fav.post!.likeCount}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfavorite(fav.id, fav.post!.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 px-2 py-1 border rounded"
                          >
                            取消收藏
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                {favoritesData.length < favoritesTotal && (
                  <button
                    onClick={() => loadFavorites(favoritesPage + 1)}
                    disabled={favoritesLoading}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                    加载更多 ({favoritesData.length}/{favoritesTotal})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
