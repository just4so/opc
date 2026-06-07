'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface CommentAuthor {
  id: string
  username: string
  name: string | null
  avatar: string | null
}

interface CommentReply {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
  replies: CommentReply[]
}

interface ProjectCommentSectionProps {
  projectSlug: string
}

export function ProjectCommentSection({ projectSlug }: ProjectCommentSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [replyTo, setReplyTo] = useState<{ commentId: string; atName?: string } | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const replyInputRef = useRef<HTMLInputElement>(null)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } finally {
      setLoading(false)
    }
  }, [projectSlug])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      router.push('/login')
      return
    }
    if (!content.trim()) {
      setError('请输入评论内容')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '评论失败')
      }
      setContent('')
      fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : '评论失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!replyContent.trim()) return
    try {
      const res = await fetch(`/api/projects/${projectSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      })
      if (res.ok) {
        setReplyTo(null)
        setReplyContent('')
        fetchComments()
      }
    } catch {
      // silent
    }
  }

  const openReply = (commentId: string, atName?: string) => {
    if (replyTo?.commentId === commentId && !atName) {
      setReplyTo(null)
      setReplyContent('')
      return
    }
    setReplyTo({ commentId, atName })
    setReplyContent(atName ? `@${atName} ` : '')
    setTimeout(() => replyInputRef.current?.focus(), 0)
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-mute">加载中...</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="说点什么鼓励一下？"
            className="w-full px-4 py-3 border border-hairline-soft rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            rows={3}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? '发布中...' : '发布评论'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-surface-soft rounded-lg p-4 text-center">
          <p className="text-mute mb-2">登录后即可发表评论</p>
          <Button onClick={() => router.push('/login')} variant="outline" size="sm">
            去登录
          </Button>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-8 w-8 text-ash mx-auto mb-3" />
          <p className="text-mute">暂无评论，来说点什么？</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-xl bg-surface-card">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${comment.author.username}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {comment.author.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-primary font-medium">
                        {(comment.author.name || comment.author.username)[0]}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="text-sm font-medium text-ink hover:text-primary transition-colors"
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
                  <p className="text-sm text-charcoal leading-relaxed">{comment.content}</p>
                  <button
                    onClick={() => openReply(comment.id)}
                    className="text-xs text-ash hover:text-primary mt-2 transition-colors"
                  >
                    回复
                  </button>

                  {/* Reply form */}
                  {replyTo?.commentId === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        ref={replyInputRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="回复..."
                        className="flex-1 px-3 py-1.5 text-sm border border-hairline-soft rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        回复
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-hairline-soft">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Link href={`/profile/${reply.author.username}`}>
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {reply.author.avatar ? (
                                <img src={reply.author.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-primary font-medium">
                                  {(reply.author.name || reply.author.username)[0]}
                                </span>
                              )}
                            </div>
                          </Link>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${reply.author.username}`}
                                className="text-xs font-medium text-ink hover:text-primary transition-colors"
                              >
                                {reply.author.name || reply.author.username}
                              </Link>
                              <span className="text-xs text-ash">
                                {formatDistanceToNow(new Date(reply.createdAt), {
                                  locale: zhCN,
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-charcoal mt-0.5">{reply.content}</p>
                            <button
                              onClick={() => openReply(comment.id, reply.author.name || reply.author.username)}
                              className="text-xs text-ash hover:text-primary mt-1 transition-colors"
                            >
                              回复
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
