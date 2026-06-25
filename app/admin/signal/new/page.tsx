'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ParsedSummary = {
  issueNo: number
  title: string
  publishedAt: string
  participantsCount: number
  sectionSummary: string[]
  raw: any
}

export default function AdminSignalNewPage() {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsed, setParsed] = useState<ParsedSummary | null>(null)
  const [parseError, setParseError] = useState('')
  const [saveError, setSaveError] = useState('')

  async function handleParse() {
    if (!html.trim()) return
    setParsing(true)
    setParseError('')
    setParsed(null)
    try {
      const res = await fetch('/api/admin/signal/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      })
      const json = await res.json()
      if (!res.ok) {
        setParseError(json.error || '解析失败')
        return
      }
      const data = json.data
      const sectionSummary = (data.sections as any[]).map((s: any) => {
        if (s.type === 'hot_topic') return `热词信号 ${s.slot}：${s.title}`
        if (s.type === 'policy') return `政策波段（${s.items?.length ?? 0} 条）`
        if (s.type === 'cases') return `实战信号（${s.items?.length ?? 0} 个案例）`
        if (s.type === 'resources') return `资源广播（${s.items?.length ?? 0} 条）`
        return `自定义板块：${s.label}`
      })
      setParsed({
        issueNo: data.issueNo,
        title: data.title,
        publishedAt: data.publishedAt,
        participantsCount: data.participants?.length ?? 0,
        sectionSummary,
        raw: data,
      })
    } catch {
      setParseError('网络错误，请重试')
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    if (!parsed) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/admin/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.raw),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.error || '保存失败')
        return
      }
      router.push(`/admin/signal/${json.id}`)
    } catch {
      setSaveError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink mb-1">新建 Signal 期号</h1>
        <p className="text-sm text-mute">粘贴 Weekly Signal HTML 页面内容，点击「AI 解析」提取结构化数据</p>
      </div>

      {/* HTML textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink mb-2">HTML 页面内容</label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="粘贴 Weekly Signal HTML 页面内容"
          rows={20}
          className="w-full px-4 py-3 text-sm rounded-2xl border border-hairline-soft bg-canvas text-ink placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
        />
      </div>

      {/* Parse button */}
      <Button
        onClick={handleParse}
        disabled={parsing || !html.trim()}
        className="mb-4"
      >
        {parsing ? '解析中…' : 'AI 解析'}
      </Button>

      {/* Parse error */}
      {parseError && (
        <p className="text-red-500 text-sm mb-4">{parseError}</p>
      )}

      {/* Parsed summary */}
      {parsed && (
        <div className="mb-6 p-4 bg-surface-card rounded-2xl border border-hairline-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">解析结果</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-mute w-20 shrink-0">期号</dt>
              <dd className="text-ink">第 {parsed.issueNo} 期</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-mute w-20 shrink-0">标题</dt>
              <dd className="text-ink">{parsed.title}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-mute w-20 shrink-0">日期</dt>
              <dd className="text-ink">{parsed.publishedAt}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-mute w-20 shrink-0">参与者</dt>
              <dd className="text-ink">{parsed.participantsCount} 人</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-mute w-20 shrink-0">板块</dt>
              <dd className="text-ink">
                <ul className="space-y-1">
                  {parsed.sectionSummary.map((s, i) => (
                    <li key={i} className="text-mute">· {s}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Save button */}
      {parsed && (
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="default"
        >
          {saving ? '保存中…' : '保存草稿'}
        </Button>
      )}

      {/* Save error */}
      {saveError && (
        <p className="text-red-500 text-sm mt-3">{saveError}</p>
      )}
    </div>
  )
}
