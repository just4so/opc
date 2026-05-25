'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'

type InquiryStatus = 'PENDING' | 'CONTACTED' | 'DONE' | 'CANCELLED'

interface Inquiry {
  id: string
  name: string
  contact: string
  city: string | null
  communityName: string | null
  introduction: string | null
  stage: string | null
  status: InquiryStatus
  wantCard: boolean
  wantVerify: boolean
  bpUrl: string | null
  bpFilename: string | null
  acceptInterview: boolean
  createdAt: string
  community: { id: string; name: string; slug: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface InquiryStats {
  todayCount: number
  statusMap: Record<string, number>
  topCommunities: { name: string; count: number }[]
}

const STATUS_TABS: { label: string; value: InquiryStatus | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '待跟进', value: 'PENDING' },
  { label: '已联系', value: 'CONTACTED' },
  { label: '已完成', value: 'DONE' },
]

const STATUS_BADGE: Record<InquiryStatus, { label: string; className: string }> = {
  PENDING: { label: '待跟进', className: 'bg-yellow-100 text-yellow-800' },
  CONTACTED: { label: '已联系', className: 'bg-blue-100 text-blue-800' },
  DONE: { label: '已完成', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

const ALL_STATUSES: InquiryStatus[] = ['PENDING', 'CONTACTED', 'DONE', 'CANCELLED']

export function InquiriesClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<InquiryStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState<string | null>(null)
  const [stats, setStats] = useState<InquiryStats | null>(null)

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (tab !== 'ALL') params.set('status', tab)

      const res = await fetch(`/api/admin/inquiries?${params}`)
      const data = await res.json()
      setInquiries(data.inquiries || [])
      setPagination(data.pagination || null)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, tab])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  useEffect(() => {
    fetch('/api/admin/stats/inquiries')
      .then(res => res.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  function handleTabChange(newTab: InquiryStatus | 'ALL') {
    setTab(newTab)
    setPage(1)
  }

  async function handleStatusChange(id: string, status: InquiryStatus) {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        await fetchInquiries()
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <div>
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-1">今日新增</div>
            <div className="text-2xl font-bold text-primary">{stats.todayCount}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-2">状态分布</div>
            <div className="flex flex-wrap gap-2">
              {(['PENDING', 'CONTACTED', 'DONE', 'CANCELLED'] as InquiryStatus[]).map(s => (
                <Badge key={s} className={STATUS_BADGE[s].className}>
                  {STATUS_BADGE[s].label} {stats.statusMap[s] || 0}
                </Badge>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-2">热门社区 Top 5</div>
            {stats.topCommunities.length > 0 ? (
              <div className="space-y-1">
                {stats.topCommunities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{c.name}</span>
                    <span className="text-gray-400 ml-2 shrink-0">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400">暂无数据</span>
            )}
          </div>
        </div>
      )}
      {/* Tabs + Export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 border-b">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams()
            if (tab !== 'ALL') params.set('status', tab)
            window.open(`/api/admin/export/inquiries?${params}`, '_blank')
          }}
        >
          <Download className="h-4 w-4 mr-1.5" />
          导出 CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">称呼</th>
                <th className="pb-3 pr-4 font-medium">联系方式</th>
                <th className="pb-3 pr-4 font-medium">意向社区</th>
                <th className="pb-3 pr-4 font-medium">城市</th>
                <th className="pb-3 pr-4 font-medium">方向</th>
                <th className="pb-3 pr-4 font-medium">阶段</th>
                <th className="pb-3 pr-4 font-medium">BP</th>
                <th className="pb-3 pr-4 font-medium">采访意向</th>
                <th className="pb-3 pr-4 font-medium">状态</th>
                <th className="pb-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const badge = STATUS_BADGE[inq.status]
                return (
                  <tr key={inq.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4">{inq.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{inq.contact}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {inq.community?.name || inq.communityName || '-'}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{inq.city || '-'}</td>
                    <td className="py-3 pr-4 text-gray-600 max-w-[120px] truncate">
                      {inq.introduction || '-'}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{inq.stage || '-'}</td>
                    <td className="py-3 pr-4">
                      {inq.bpUrl ? (
                        <a
                          href={inq.bpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {inq.bpFilename || '查看BP'}
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {inq.acceptInterview ? (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">愿意</span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={inq.status}
                        disabled={updating === inq.id}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${badge.className}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_BADGE[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(inq.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
