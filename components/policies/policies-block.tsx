'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

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
  EXPIRED: { label: '已过期', className: 'bg-gray-100 text-gray-600' },
}

export default function PoliciesBlock({
  policies,
  provinces,
  total,
  cityCount,
  currentProvince,
}: PoliciesBlockProps) {
  const [selectedProvince, setSelectedProvince] = useState(currentProvince)

  const filtered = selectedProvince
    ? policies.filter((p) => p.province === selectedProvince)
    : policies

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            📋 专项政策
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {total} 条，覆盖 {cityCount}+ 城市
          </p>
        </div>
        <a
          href="/news?category=POLICY"
          className="text-sm text-primary hover:underline"
        >
          查看政策资讯 →
        </a>
      </div>

      {/* 省份筛选 */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setSelectedProvince('')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !selectedProvince
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 政策卡片网格 */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无政策数据</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((policy) => {
            const badge = STATUS_BADGE[policy.status] || STATUS_BADGE.ACTIVE
            const location = [policy.city, policy.district].filter(Boolean).join(' · ')
            const isClickable = !!policy.sourceUrl

            const cardContent = (
              <div className="h-full flex flex-col">
                <div className="text-xs text-gray-400 mb-1">{location || policy.province}</div>
                <div className="font-medium text-sm text-gray-800 mb-1.5 line-clamp-2 flex-1">
                  {policy.title}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{policy.summary}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {isClickable && (
                    <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
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
                  className="block p-4 border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  {cardContent}
                </a>
              )
            }

            return (
              <div
                key={policy.id}
                className="p-4 border border-gray-100 rounded-lg cursor-default"
              >
                {cardContent}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
