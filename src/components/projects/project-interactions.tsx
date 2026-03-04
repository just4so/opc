'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
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

interface ProjectInteractionsProps {
  projectSlug: string
  initialLikeCount: number
  initialCommentCount: number
  initialComments: Comment[]
}

export function ProjectInteractions({
  projectSlug,
  initialLikeCount,
  initialCommentCount,
  initialComments,
}: ProjectInteractionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [isLiking, setIsLiking] = useState(false)

  // 检查是否已点赞
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/projects/${projectSlug}/like`)
        .then((res) => res.json())
        .then((data) => setLiked(data.liked))
        .catch(() => {})
    }
  }, [projectSlug, session])

  const handleLike = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    if (isLiking) return
    setIsLiking(true)

    try {
      const res = await fetch(`/api/projects/${projectSlug}/like`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setLiked(data.liked)
        setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
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

  return (
    <>
      {/* 互动栏 */}
      <div className="flex items-center space-x-6 pt-4 border-t text-gray-500">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 transition-colors ${
            liked ? 'text-red-500' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount} 赞</span>
        </button>
        <div className="flex items-center space-x-2 text-gray-500">
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount} 评论</span>
        </div>
        <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
          <Share2 className="h-5 w-5" />
          <span>分享</span>
        </button>
      </div>

      {/* 评论区 */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">评论 ({commentCount})</h3>

          {/* 评论表单 */}
          <div className="mb-6">
            <CommentForm projectSlug={projectSlug} onCommentAdded={handleCommentAdded} />
          </div>

          {/* 评论列表 */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                    {comment.author.name?.[0] || comment.author.username[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {comment.author.name || comment.author.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          locale: zhCN,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无评论，来说两句吧</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
