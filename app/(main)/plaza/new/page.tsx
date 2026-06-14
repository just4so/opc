'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PlazaTagInput } from '@/components/plaza/tag-input'

const PostRichTextEditor = dynamic(
  () => import('@/components/plaza/post-rich-text-editor').then(m => ({ default: m.PostRichTextEditor })),
  { ssr: false, loading: () => <div className="h-40 rounded-2xl border bg-surface-soft animate-pulse" /> }
)

const POST_TYPES = [
  { id: 'SHARE',  color: 'bg-green-500', name: '分享',   desc: '经验、资源、工具推荐' },
  { id: 'DEMAND', color: 'bg-blue-500',  name: '发需求', desc: '找人合作、发布外包需求' },
  { id: 'CHAT',   color: 'bg-gray-400',  name: '随便聊', desc: '随聊、日记、随想' },
]

const BUDGET_TYPES = [
  { id: 'NEGOTIABLE', name: '面议' },
  { id: 'FIXED',      name: '固定价格' },
  { id: 'RANGE',      name: '价格区间' },
]

const CONTACT_TYPES = [
  { id: 'WECHAT', name: '微信' },
  { id: 'EMAIL',  name: '邮件' },
  { id: 'PHONE',  name: '电话' },
]

export default function NewPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [type, setType] = useState(searchParams.get('type') || 'SHARE')
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [topics, setTopics] = useState<string[]>([])

  // 高级选项（可选，所有类型共享）
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [budgetType, setBudgetType] = useState('NEGOTIABLE')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deadline, setDeadline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [contactType, setContactType] = useState('WECHAT')
  const [contactInfo, setContactInfo] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!contentHtml || contentHtml.replace(/<[^>]*>/g, '').trim().length === 0) {
      setError('请输入内容')
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, any> = {
        contentHtml,
        type,
        topics,
        images: [],
        title: title.trim() || undefined,
      }

      if (showAdvanced) {
        if (budgetType !== 'NEGOTIABLE') {
          payload.budgetType = budgetType
          if (budgetType === 'FIXED' && budgetMin) payload.budgetMin = budgetMin
          if (budgetType === 'RANGE') {
            if (budgetMin) payload.budgetMin = budgetMin
            if (budgetMax) payload.budgetMax = budgetMax
          }
        } else if (budgetType === 'NEGOTIABLE' && (contactInfo || deadline || skills.length)) {
          payload.budgetType = budgetType
        }
        if (deadline) payload.deadline = deadline
        if (skills.length) payload.skills = skills
        if (contactInfo.trim()) {
          payload.contactType = contactType
          payload.contactInfo = contactInfo.trim()
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '发布失败')
        return
      }

      if (type === 'DEMAND') {
        router.push('/plaza?tab=posts&type=DEMAND')
      } else {
        router.push(`/plaza/${data.id}`)
      }
      router.refresh()
    } catch {
      setError('发布失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-soft to-canvas">
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/plaza" className="inline-flex items-center text-mute hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回创业者广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">发帖</h1>
          <p className="text-mute text-sm mt-1">分享你的想法、需求或随便聊聊</p>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>
              )}

              {/* 类型选择 */}
              <div>
                <label className="text-sm font-medium text-charcoal mb-2 block">选择类型</label>
                <div className="flex gap-2 flex-wrap">
                  {POST_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      title={pt.desc}
                      onClick={() => setType(pt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                        type === pt.id
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-hairline-soft bg-canvas text-mute hover:border-hairline hover:bg-surface-soft'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pt.color}`} />
                      {pt.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ash mt-1.5">
                  {POST_TYPES.find(p => p.id === type)?.desc}
                </p>
              </div>

              {/* 标题（可选） */}
              <div>
                <label className="text-sm font-medium text-charcoal mb-2 block">
                  标题 <span className="text-ash font-normal">（可选）</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给帖子起个标题..."
                  maxLength={100}
                />
              </div>

              {/* 富文本内容 */}
              <div>
                <label className="text-sm font-medium text-charcoal mb-2 block">
                  内容 <span className="text-red-500">*</span>
                </label>
                <PostRichTextEditor onChange={setContentHtml} placeholder="分享你的想法、需求或随便聊聊..." />
              </div>

              {/* 话题标签 */}
              <div>
                <label className="text-sm font-medium text-charcoal mb-2 block">
                  话题标签 <span className="text-ash font-normal">（最多5个）</span>
                </label>
                <PlazaTagInput value={topics} onChange={setTopics} maxTags={5} placeholder="输入或搜索话题..." />
              </div>

              {/* 高级选项（可折叠） */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-mute hover:text-ink transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  高级选项
                  <span className="text-ash font-normal">（联系方式、预算、截止日期等）</span>
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 p-4 bg-surface-soft rounded-2xl border border-hairline-soft">
                    {/* 联系方式 */}
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-2 block">
                        联系方式 <span className="text-ash font-normal">（可选）</span>
                      </label>
                      <div className="flex gap-2 mb-2">
                        {CONTACT_TYPES.map((ct) => (
                          <button
                            key={ct.id}
                            type="button"
                            onClick={() => setContactType(ct.id)}
                            className={`px-3 py-1.5 rounded-2xl text-sm transition-colors ${
                              contactType === ct.id ? 'bg-primary text-white' : 'bg-canvas border border-hairline-soft hover:border-primary text-mute'
                            }`}
                          >
                            {ct.name}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder={
                          contactType === 'WECHAT' ? '微信号' :
                          contactType === 'EMAIL' ? '邮箱地址' : '电话号码'
                        }
                      />
                    </div>

                    {/* 预算类型 */}
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-2 block">预算类型</label>
                      <div className="flex gap-2">
                        {BUDGET_TYPES.map((bt) => (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => setBudgetType(bt.id)}
                            className={`px-3 py-1.5 rounded-2xl text-sm transition-colors ${
                              budgetType === bt.id ? 'bg-primary text-white' : 'bg-canvas border border-hairline-soft hover:border-primary text-mute'
                            }`}
                          >
                            {bt.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 预算金额 */}
                    {budgetType === 'FIXED' && (
                      <div>
                        <label className="text-sm font-medium text-charcoal mb-2 block">金额（元）</label>
                        <Input
                          type="number"
                          min="0"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          placeholder="固定金额"
                          className="w-40"
                        />
                      </div>
                    )}
                    {budgetType === 'RANGE' && (
                      <div>
                        <label className="text-sm font-medium text-charcoal mb-2 block">金额区间（元）</label>
                        <div className="flex items-center gap-2">
                          <Input type="number" min="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="最低" className="w-32" />
                          <span className="text-ash">–</span>
                          <Input type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="最高" className="w-32" />
                        </div>
                      </div>
                    )}

                    {/* 截止日期 */}
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-2 block">
                        截止日期 <span className="text-ash font-normal">（可选）</span>
                      </label>
                      <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-48"
                      />
                    </div>

                    {/* 所需技能 */}
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-2 block">
                        所需技能 <span className="text-ash font-normal">（最多10个）</span>
                      </label>
                      <PlazaTagInput value={skills} onChange={setSkills} maxTags={10} placeholder="如：React、设计、运营..." />
                    </div>
                  </div>
                )}
              </div>

              {/* 提交 */}
              <div className="flex justify-center gap-4 pt-2">
                <Link href="/plaza">
                  <Button type="button" variant="outline" className="h-11 px-8">取消</Button>
                </Link>
                <Button type="submit" disabled={loading} className="h-11 px-8">
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
