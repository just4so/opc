'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  postId?: string
  projectSlug?: string
  onCommentAdded?: (comment: any) => void
}

export function CommentForm({ postId, projectSlug, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      const url = postId
        ? `/api/posts/${postId}/comments`
        : `/api/projects/${projectSlug}/comments`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '评论失败')
      }

      const comment = await res.json()
      setContent('')
      onCommentAdded?.(comment)
    } catch (err) {
      setError(err instanceof Error ? err.message : '评论失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600 mb-2">登录后即可发表评论</p>
        <Button onClick={() => router.push('/login')} variant="outline" size="sm">
          去登录
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        rows={3}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? '发布中...' : '发布评论'}
        </Button>
      </div>
    </form>
  )
}
