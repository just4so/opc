'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PlazaTagInput } from '@/components/plaza/tag-input'
import { MILESTONES } from '@/constants/topics'

const PostRichTextEditor = dynamic(
  () => import('@/components/plaza/post-rich-text-editor').then(m => ({ default: m.PostRichTextEditor })),
  { ssr: false, loading: () => <div className="h-40 rounded-2xl border bg-surface-soft animate-pulse" /> }
)

const POST_TYPES = [
  { id: 'CHAT',     color: 'bg-gray-400',   name: '聊聊',    desc: '随聊、日记、创业进度' },
  { id: 'HELP',     color: 'bg-orange-400', name: '求助',    desc: '遇到问题寻求建议' },
  { id: 'SHARE',    color: 'bg-green-500',  name: '分享',    desc: '经验、资源、工具推荐' },
  { id: 'COLLAB',   color: 'bg-blue-500',   name: '找人',    desc: '找合伙人、外包或合作' },
  { id: 'PROGRESS', color: 'bg-orange-500', name: '创业进展', desc: '记录你的创业里程碑' },
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

  const [type, setType] = useState(searchParams.get('type') || 'CHAT')
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [milestone, setMilestone] = useState('')
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '')
  const [userProjects, setUserProjects] = useState<{ id: string; name: string; slug: string }[]>([])
  // COLLAB fields
  const [budgetType, setBudgetType] = useState('NEGOTIABLE')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deadline, setDeadline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [contactType, setContactType] = useState('WECHAT')
  const [contactInfo, setContactInfo] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (type === 'PROGRESS') {
      fetch('/api/user/projects/list')
        .then(res => res.ok ? res.json() : [])
        .then(data => setUserProjects(Array.isArray(data) ? data : []))
        .catch(() => setUserProjects([]))
    }
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!contentHtml || contentHtml.replace(/<[^>]*>/g, '').trim().length === 0) {
      setError('请输入内容')
      return
    }

    if (type === 'COLLAB' && !contactInfo.trim()) {
      setError('找人类型帖子必须填写联系方式')
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
        milestone: type === 'PROGRESS' && milestone ? milestone : undefined,
        projectId: type === 'PROGRESS' && projectId ? projectId : undefined,
      }

      if (type === 'COLLAB') {
        payload.budgetType = budgetType
        if (budgetType === 'FIXED' && budgetMin) payload.budgetMin = budgetMin
        if (budgetType === 'RANGE') {
          if (budgetMin) payload.budgetMin = budgetMin
          if (budgetMax) payload.budgetMax = budgetMax
        }
        if (deadline) payload.deadline = deadline
        if (skills.length) payload.skills = skills
        payload.contactType = contactType
        payload.contactInfo = contactInfo.trim()
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

      router.push('/plaza')
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
            返回交流广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 页面标题区 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">发帖</h1>
          <p className="text-mute text-sm mt-1">分享你的想法、问题或寻找合作伙伴</p>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>
              )}

              {/* 意图选择 */}
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
                <label className="text-sm font-medium text-charcoal mb-2 block">内容 <span className="text-red-500">*</span></label>
                <PostRichTextEditor onChange={setContentHtml} placeholder="分享你的想法、问题或资源..." />
              </div>

              {/* 话题标签 */}
              <div>
                <label className="text-sm font-medium text-charcoal mb-2 block">
                  话题标签 <span className="text-ash font-normal">（最多5个）</span>
                </label>
                <PlazaTagInput value={topics} onChange={setTopics} maxTags={5} placeholder="输入或搜索话题..." />
              </div>

              {/* PROGRESS 里程碑选择 */}
              {type === 'PROGRESS' && (
                <div>
                  <label className="text-sm font-medium text-charcoal mb-2 block">
                    里程碑标签 <span className="text-ash font-normal">（可选）</span>
                  </label>
                  <select
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    className="w-full rounded-lg border border-hairline-soft bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">选择一个里程碑...</option>
                    {MILESTONES.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* PROGRESS 关联产品 */}
              {type === 'PROGRESS' && userProjects.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-charcoal mb-2 block">
                    关联产品 <span className="text-ash font-normal">（可选）</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-hairline-soft bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">不关联产品</option>
                    {userProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* COLLAB 专属字段 */}
              {type === 'COLLAB' && (
                <div className="space-y-4 p-4 bg-surface-soft rounded-xl border border-hairline-soft">
                  <h3 className="text-sm font-semibold text-charcoal">找人详情</h3>

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

                  {/* 联系方式 */}
                  <div>
                    <label className="text-sm font-medium text-charcoal mb-2 block">联系方式 <span className="text-red-500">*</span></label>
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
                      required={type === 'COLLAB'}
                    />
                  </div>
                </div>
              )}

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
