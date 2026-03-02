'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TOPICS, POST_TYPES } from '@/constants/topics'

export default function NewPostPage() {
  const router = useRouter()

  const [content, setContent] = useState('')
  const [type, setType] = useState('DAILY')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('请输入内容')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          topics: selectedTopics,
          images: [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '发布失败')
        return
      }

      router.push('/plaza')
      router.refresh()
    } catch (err) {
      setError('发布失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/plaza"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回创业广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>发布动态</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* 内容类型 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  内容类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {POST_TYPES.map((postType) => (
                    <button
                      key={postType.id}
                      type="button"
                      onClick={() => setType(postType.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        type === postType.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {postType.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 内容输入 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享你的创业故事、经验、问题或资源..."
                  className="w-full h-40 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <div className="text-right text-sm text-gray-400 mt-1">
                  {content.length} 字
                </div>
              </div>

              {/* 话题标签 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  话题标签（可选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                        selectedTopics.includes(topic.id)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-200 hover:border-primary'
                      }`}
                      style={
                        !selectedTopics.includes(topic.id)
                          ? { color: topic.color, borderColor: topic.color }
                          : {}
                      }
                    >
                      #{topic.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4">
                <Link href="/plaza">
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? '发布中...' : '发布'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
