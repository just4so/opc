'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, ScrollText } from 'lucide-react'

interface Policy {
  id: string
  province: string
  city: string | null
  district: string | null
  title: string
  summary: string
  sourceUrl: string | null
  status: string
}

interface PoliciesBlockProps {
  policies: Policy[]
  provinces: string[]
  total: number
  cityCount: number
  currentProvince: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: '已发布', className: 'bg-green-100 text-green-700' },
  DRAFT: { label: '征求意见', className: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { label: '已过期', className: 'bg-surface-card text-mute' },
}

export default function PoliciesBlock({
  policies,
  provinces,
  total,
  cityCount,
  currentProvince,
}: PoliciesBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState(currentProvince)

  const filtered = selectedProvince
    ? policies.filter((p) => p.province === selectedProvince)
    : policies

  // 收起状态：只显示入口卡片
  if (!expanded) {
    return (
      <div className="bg-white rounded-xl border border-hairline-soft shadow-sm mb-8 overflow-hidden">
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-left px-6 py-5 hover:bg-surface-soft transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <ScrollText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink">全国 OPC 专项政策库</h2>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {total} 条
                  </span>
                </div>
                <p className="text-xs text-mute mt-0.5">
                  覆盖 {cityCount}+ 城市 · 从省级到区县 · 含补贴、算力券、免租工位等
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-ash group-hover:text-primary transition-colors ml-4 flex-shrink-0">
              <span>展开查看</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {/* 省份预览标签 */}
          <div className="flex flex-wrap gap-1.5 mt-3 ml-12">
            {provinces.slice(0, 8).map((p) => (
              <span key={p} className="text-xs text-ash bg-surface-soft px-2 py-0.5 rounded">
                {p}
              </span>
            ))}
            {provinces.length > 8 && (
              <span className="text-xs text-ash">+{provinces.length - 8} 个省市</span>
            )}
          </div>
        </button>
      </div>
    )
  }

  // 展开状态
  return (
    <div className="bg-white rounded-xl border border-hairline-soft shadow-sm mb-8">
      {/* 标题行 */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">全国 OPC 专项政策库</h2>
            <p className="text-xs text-mute mt-0.5">共 {total} 条，覆盖 {cityCount}+ 城市</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-xs text-ash hover:text-mute transition-colors"
        >
          <span>收起</span>
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 pb-6">
        {/* 省份筛选 */}
        <div className="flex flex-wrap gap-2 py-4">
          <button
            onClick={() => setSelectedProvince('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !selectedProvince
                ? 'bg-primary text-white'
                : 'bg-surface-card text-mute hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {provinces.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvince(p === selectedProvince ? '' : p)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedProvince === p
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-mute hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 政策卡片网格 */}
        {filtered.length === 0 ? (
          <p className="text-ash text-sm text-center py-4">暂无政策数据</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((policy) => {
              const badge = STATUS_BADGE[policy.status] || STATUS_BADGE.ACTIVE
              const location = [policy.city, policy.district].filter(Boolean).join(' · ')
              const isClickable = !!policy.sourceUrl

              const cardContent = (
                <div className="h-full flex flex-col">
                  <div className="text-xs text-ash mb-1">{location || policy.province}</div>
                  <div className="font-medium text-sm text-ink mb-1.5 line-clamp-2 flex-1">
                    {policy.title}
                  </div>
                  <p className="text-xs text-mute line-clamp-2 mb-2">{policy.summary}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {isClickable && (
                      <span className="ml-auto flex items-center gap-0.5 text-xs text-primary">
                        查看原文
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              )

              if (isClickable) {
                return (
                  <a
                    key={policy.id}
                    href={policy.sourceUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-hairline-soft rounded-lg hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    {cardContent}
                  </a>
                )
              }

              return (
                <div key={policy.id} className="p-4 border border-hairline-soft rounded-lg">
                  {cardContent}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
