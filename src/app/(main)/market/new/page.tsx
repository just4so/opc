'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES, MARKET_CATEGORIES, BUDGET_TYPES } from '@/constants/topics'

export default function NewOrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    contentType: 'DEMAND',
    name: '',
    tagline: '',
    description: '',
    category: [] as string[],
    skills: '',
    budgetType: 'NEGOTIABLE',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    contactType: '',
    contactInfo: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 检查登录状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const handleCategoryToggle = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter((c) => c !== cat)
        : [...prev.category, cat],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '发布失败')
      }

      const order = await res.json()
      router.push(`/market/${order.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/market"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回合作广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">发布需求</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 订单类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  订单类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, contentType: type.id })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.contentType === type.id
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {type.id === 'DEMAND' ? (
                          <Briefcase className="h-6 w-6" style={{ color: type.color }} />
                        ) : (
                          <Handshake className="h-6 w-6" style={{ color: type.color }} />
                        )}
                      </div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  需求标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：需要一个小程序开发"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              {/* 一句话描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  一句话描述 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="简短描述你的需求"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              {/* 详细描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细说明需求内容、期望效果等"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  required
                />
              </div>

              {/* 服务分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  服务分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {MARKET_CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={formData.category.includes(cat) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 所需技能 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所需技能
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="用逗号分隔，如：React, Node.js, UI设计"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* 预算设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  预算设置
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {BUDGET_TYPES.map((type) => (
                    <Badge
                      key={type.id}
                      variant={formData.budgetType === type.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, budgetType: type.id })}
                    >
                      {type.name}
                    </Badge>
                  ))}
                </div>
                {(formData.budgetType === 'FIXED' || formData.budgetType === 'RANGE') && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        placeholder={formData.budgetType === 'FIXED' ? '预算金额' : '最低预算'}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    {formData.budgetType === 'RANGE' && (
                      <div className="flex-1">
                        <input
                          type="number"
                          value={formData.budgetMax}
                          onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                          placeholder="最高预算"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 截止日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* 联系方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系方式
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.contactType}
                    onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">选择联系方式</option>
                    <option value="wechat">微信</option>
                    <option value="email">邮箱</option>
                    <option value="phone">手机</option>
                  </select>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="联系方式内容"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Link href="/market">
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '发布中...' : '发布需求'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
