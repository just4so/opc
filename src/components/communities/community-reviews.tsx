'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReviewUser {
  id: string
  name: string | null
  username: string
  avatar: string | null
}

interface Review {
  id: string
  content: string
  difficulty: number | null
  createdAt: string
  user: ReviewUser
}

interface CommunityReviewsProps {
  slug: string
}

function DifficultyStars({
  value,
  interactive,
  onChange,
}: {
  value: number
  interactive?: boolean
  onChange?: (v: number) => void
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          <Star
            className={`h-4 w-4 ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

export default function CommunityReviews({ slug }: CommunityReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgDifficulty, setAvgDifficulty] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [content, setContent] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [slug])

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/communities/${encodeURIComponent(slug)}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
        setAvgDifficulty(data.avgDifficulty)
        if (session?.user?.id) {
          const uid = session.user.id
          setHasReviewed(data.reviews.some((r: Review) => r.user.id === uid))
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  // Update hasReviewed when session changes
  useEffect(() => {
    if (session?.user?.id && reviews.length > 0) {
      const uid = session.user.id
      setHasReviewed(reviews.some((r) => r.user.id === uid))
    }
  }, [session, reviews])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('请输入评价内容')
      return
    }
    if (content.trim().length > 200) {
      setError('评价内容不能超过200字')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/communities/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          difficulty: difficulty > 0 ? difficulty : null,
        }),
      })

      if (res.ok) {
        setContent('')
        setDifficulty(0)
        fetchReviews()
      } else {
        const data = await res.json()
        setError(data.error || '提交失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            创业者评价
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({reviews.length}条)
              </span>
            )}
          </CardTitle>
          {avgDifficulty != null && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>平均难度</span>
              <DifficultyStars value={Math.round(avgDifficulty)} />
              <span className="font-medium">{avgDifficulty.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 评价列表 */}
        {loading ? (
          <div className="text-center text-gray-400 py-4">加载中...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            暂无评价，来做第一个评价的人吧
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayReviews.map((review) => (
                <div key={review.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {review.user.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                        {(review.user.name || review.user.username).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {review.user.name || review.user.username}
                      </span>
                      {review.difficulty != null && (
                        <DifficultyStars value={review.difficulty} />
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-center text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-2"
              >
                {showAll ? (
                  <>收起 <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>查看全部 {reviews.length} 条评价 <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            )}
          </>
        )}

        {/* 提交评价 */}
        <div className="border-t pt-4">
          {!session ? (
            <div className="text-center py-3">
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 text-sm"
              >
                登录后参与评价 →
              </Link>
            </div>
          ) : hasReviewed ? (
            <div className="text-center text-sm text-gray-400 py-3">
              你已评价过该社区
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="真实的入驻经历、注意事项、建议..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <div className="text-right text-xs text-gray-400">
                  {content.length}/200
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>申请难度：</span>
                  <DifficultyStars
                    value={difficulty}
                    interactive
                    onChange={setDifficulty}
                  />
                  {difficulty > 0 && (
                    <button
                      type="button"
                      onClick={() => setDifficulty(0)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      清除
                    </button>
                  )}
                </div>
                <Button type="submit" size="sm" disabled={submitting}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {submitting ? '提交中...' : '提交评价'}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
