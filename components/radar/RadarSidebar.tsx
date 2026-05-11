'use client'

import { useState } from 'react'
import Link from 'next/link'

type IssueEntry = {
  issueNo: number
  publishedAt: string // ISO string
  title: string | null
}

type MonthGroup = {
  label: string // "2026年5月"
  key: string   // "2026-05"
  issues: IssueEntry[]
}

export function RadarSidebar({
  issues,
  latestIssueNo,
}: {
  issues: IssueEntry[]
  latestIssueNo: number
}) {
  // 按月份分组
  const groups: MonthGroup[] = []
  const groupMap: Record<string, MonthGroup> = {}

  for (const issue of issues) {
    const d = new Date(issue.publishedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    if (!groupMap[key]) {
      const g: MonthGroup = { label, key, issues: [] }
      groupMap[key] = g
      groups.push(g)
    }
    groupMap[key].issues.push(issue)
  }

  // 默认展开最新月份
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    new Set(groups.length > 0 ? [groups[0].key] : [])
  )

  const toggle = (key: string) => {
    setOpenKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
      {/* 最新一期 */}
      <div className="px-4 pb-3 mb-1 border-b border-[#292524]">
        <Link
          href={`/radar/${latestIssueNo}`}
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#F97316] hover:bg-[#EA6C0A] transition-colors"
        >
          <span className="text-white text-xs font-bold tracking-wide">最新一期</span>
          <span className="text-orange-100 text-xs font-mono ml-auto">#{latestIssueNo}</span>
        </Link>
      </div>

      {/* 按月折叠 */}
      {groups.map(group => (
        <div key={group.key} className="mb-1">
          {/* 月份标题 */}
          <button
            onClick={() => toggle(group.key)}
            className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-[#292524] transition-colors group"
          >
            <span className="text-xs font-semibold text-[#A8A29E] group-hover:text-[#E7E5E4] tracking-wide">
              {group.label}
            </span>
            <span className="text-[#57534E] text-xs">
              {openKeys.has(group.key) ? '▾' : '▸'}
            </span>
          </button>

          {/* 期刊列表 */}
          {openKeys.has(group.key) && (
            <div className="pb-1">
              {group.issues.map(issue => {
                const d = new Date(issue.publishedAt)
                const mm = String(d.getMonth() + 1).padStart(2, '0')
                const dd = String(d.getDate()).padStart(2, '0')
                return (
                  <Link
                    key={issue.issueNo}
                    href={`/radar/${issue.issueNo}`}
                    className="group/item flex items-center gap-3 px-4 py-2 hover:bg-[#292524] transition-colors relative"
                    title={issue.title || `第 ${issue.issueNo} 期`}
                  >
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F97316] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-[11px] font-mono text-[#F97316] w-8 shrink-0">
                      #{issue.issueNo}
                    </span>
                    <span className="text-[11px] text-[#57534E] group-hover/item:text-[#A8A29E] transition-colors font-mono shrink-0">
                      {mm}/{dd}
                    </span>
                    <span className="text-[11px] text-[#57534E] group-hover/item:text-[#D6D3D1] transition-colors truncate">
                      {issue.title?.replace(/^OPC 雷达 /, '') || ''}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
