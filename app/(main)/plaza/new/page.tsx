'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PostRichTextEditor } from '@/components/plaza/post-rich-text-editor'
import { PlazaTagInput } from '@/components/plaza/tag-input'

const POST_TYPES = [
  { id: 'CHAT',   emoji: '💬', name: '聊聊',  desc: '随聊、日记、创业进度' },
  { id: 'HELP',   emoji: '❓', name: '求助',  desc: '遇到问题寻求建议' },
  { id: 'SHARE',  emoji: '📣', name: '分享',  desc: '经验、资源、工具推荐' },
  { id: 'COLLAB', emoji: '🤝', name: '找人',  desc: '找合伙人、外包或合作' },
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

  const [type, setType] = useState('CHAT')
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [topics, setTopics] = useState<string[]>([])

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/plaza" className="inline-flex items-center text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回交流广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 页面标题区 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">发帖</h1>
          <p className="text-slate-500 text-sm mt-1">分享你的想法、问题或寻找合作伙伴</p>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>
              )}

              {/* 意图选择 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">选择类型</label>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {POST_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setType(pt.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex-shrink-0 ${
                        type === pt.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-1">{pt.emoji}</div>
                      <div className="font-medium text-sm">{pt.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题（可选） */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  标题 <span className="text-gray-400 font-normal">（可选）</span>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">内容 <span className="text-red-500">*</span></label>
                <PostRichTextEditor onChange={setContentHtml} placeholder="分享你的想法、问题或资源..." />
              </div>

              {/* 话题标签 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  话题标签 <span className="text-gray-400 font-normal">（最多5个）</span>
                </label>
                <PlazaTagInput value={topics} onChange={setTopics} maxTags={5} placeholder="输入或搜索话题..." />
              </div>

              {/* COLLAB 专属字段 */}
              {type === 'COLLAB' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700">🤝 找人详情</h3>

                  {/* 预算类型 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">预算类型</label>
                    <div className="flex gap-2">
                      {BUDGET_TYPES.map((bt) => (
                        <button
                          key={bt.id}
                          type="button"
                          onClick={() => setBudgetType(bt.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            budgetType === bt.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 hover:border-primary text-gray-600'
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">金额（元）</label>
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">金额区间（元）</label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="最低" className="w-32" />
                        <span className="text-gray-400">–</span>
                        <Input type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="最高" className="w-32" />
                      </div>
                    </div>
                  )}

                  {/* 截止日期 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      截止日期 <span className="text-gray-400 font-normal">（可选）</span>
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
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      所需技能 <span className="text-gray-400 font-normal">（最多10个）</span>
                    </label>
                    <PlazaTagInput value={skills} onChange={setSkills} maxTags={10} placeholder="如：React、设计、运营..." />
                  </div>

                  {/* 联系方式 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">联系方式 <span className="text-red-500">*</span></label>
                    <div className="flex gap-2 mb-2">
                      {CONTACT_TYPES.map((ct) => (
                        <button
                          key={ct.id}
                          type="button"
                          onClick={() => setContactType(ct.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            contactType === ct.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 hover:border-primary text-gray-600'
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
