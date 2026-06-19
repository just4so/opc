'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { CommentForm } from '@/components/comments/comment-form'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

interface PostInteractionsProps {
  postId: string
  initialLikeCount: number
  initialCommentCount: number
  initialComments: Comment[]
}

export function PostInteractions({
  postId,
  initialLikeCount,
  initialCommentCount,
  initialComments,
}: PostInteractionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [isLiking, setIsLiking] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [copyTip, setCopyTip] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const [animateLike, setAnimateLike] = useState(false)

  // 检查是否已点赞
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/posts/${postId}/like`)
        .then((res) => res.json())
        .then((data) => setLiked(data.liked))
        .catch(() => {})
    }
  }, [postId, session])

  // 检查是否已收藏
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/posts/${postId}/favorite`)
        .then((res) => res.json())
        .then((data) => setFavorited(data.favorited))
        .catch(() => {})
    }
  }, [postId, session])

  const handleLike = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    if (isLiking) return
    setIsLiking(true)
    setAnimateLike(true)
    setTimeout(() => setAnimateLike(false), 300)

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setLiked(data.liked)
        if (data.likeCount !== undefined) setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Like error:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [comment, ...prev])
    setCommentCount((prev) => prev + 1)
  }

  const handleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (isFavoriting) return
    setIsFavoriting(true)
    // 乐观更新
    setFavorited((prev) => !prev)
    try {
      const res = await fetch(`/api/posts/${postId}/favorite`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setFavorited(data.favorited)
      } else {
        setFavorited((prev) => !prev) // 回滚
      }
    } catch {
      setFavorited((prev) => !prev) // 回滚
    } finally {
      setIsFavoriting(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyTip(true)
      setTimeout(() => setCopyTip(false), 2000)
    } catch {
      // 降级：选中 URL
      window.prompt('复制链接', window.location.href)
    }
  }

  return (
    <>
      {/* 互动栏 */}
      <div className="flex items-center space-x-6 pt-4 border-t text-mute">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 transition-colors ${
            liked ? 'text-primary' : 'hover:text-primary'
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''} ${animateLike ? 'animate-heartbeat' : ''}`} />
          <span>{likeCount} 赞</span>
        </button>
        <div className="flex items-center space-x-2 text-mute">
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount} 评论</span>
        </div>
        <button
          onClick={handleFavorite}
          disabled={isFavoriting}
          className={`flex items-center space-x-2 transition-colors ${
            favorited ? 'text-yellow-500' : 'hover:text-yellow-500'
          }`}
        >
          <Bookmark className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
          <span>{favorited ? '已收藏' : '收藏'}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 hover:text-primary transition-colors relative"
        >
          <Share2 className="h-5 w-5" />
          <span>{copyTip ? '已复制！' : '分享'}</span>
        </button>
      </div>

      {/* 评论区 */}
      <Card id="comments" className="mt-6 scroll-mt-16">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">评论 ({commentCount})</h3>

          {/* 评论表单 */}
          <div className="mb-6">
            <CommentForm postId={postId} onCommentAdded={handleCommentAdded} placeholder="说点什么鼓励一下？" />
          </div>

          {/* 评论列表 */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {(showAllComments ? comments : comments.slice(0, 3)).map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Link href={`/profile/${comment.author.username}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-mute flex-shrink-0 hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden">
                      {comment.author.avatar ? (
                        <img src={comment.author.avatar} alt={comment.author.name || comment.author.username} className="w-full h-full object-cover" />
                      ) : (
                        <span>{comment.author.name?.[0] || comment.author.username[0]}</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {comment.author.name || comment.author.username}
                      </Link>
                      <span className="text-xs text-ash">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          locale: zhCN,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-charcoal text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
              {!showAllComments && comments.length > 3 && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="text-sm text-primary hover:text-primary-pressed transition-colors font-medium"
                >
                  查看更多评论 ({comments.length - 3})
                </button>
              )}
            </div>
          ) : (
            <p className="text-mute text-center py-8">暂无评论，来说两句吧</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
