'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROJECT_STAGES, PROJECT_CATEGORIES } from '@/constants/topics'

export default function NewProjectPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [stage, setStage] = useState('IDEA')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [techStack, setTechStack] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !tagline.trim() || !description.trim()) {
      setError('请填写项目名称、一句话介绍和详细描述')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          website: website || undefined,
          github: github || undefined,
          stage,
          category: selectedCategories,
          techStack: techStack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '发布失败')
        return
      }

      router.push('/projects')
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
            href="/projects"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回项目展示
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>发布项目</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* 项目名称 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  项目名称 *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的项目名称"
                  required
                />
              </div>

              {/* 一句话介绍 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  一句话介绍 *
                </label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="用一句话描述你的项目"
                  required
                />
              </div>

              {/* 详细描述 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  详细描述 *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细介绍你的项目，包括功能、目标用户、商业模式等"
                  className="w-full h-32 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* 项目阶段 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  项目阶段
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_STAGES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                        stage === s.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-200 hover:border-primary'
                      }`}
                      style={
                        stage !== s.id
                          ? { color: s.color, borderColor: s.color }
                          : {}
                      }
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 项目分类 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  项目分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(cat)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 技术栈 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  技术栈
                </label>
                <Input
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="用逗号分隔，如：Next.js, PostgreSQL, TailwindCSS"
                />
              </div>

              {/* 链接 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    官网链接
                  </label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-project.com"
                    type="url"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    GitHub
                  </label>
                  <Input
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    type="url"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/projects">
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? '发布中...' : '发布项目'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
