'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UserRole = 'ADMIN' | 'MODERATOR' | 'CITY_MANAGER' | 'USER'

interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  targetType: string
  targetId: string
  targetName: string
  changes: Record<string, { before: unknown; after: unknown }> | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface LogsClientProps {
  role: UserRole
  selfId: string
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: '创建',
  UPDATE: '编辑',
  DELETE: '删除',
  STATUS_CHANGE: '状态变更',
  APPROVE: '审核通过',
  REJECT: '审核拒绝',
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  COMMUNITY: '社区',
  INQUIRY: '意向',
  POLICY: '政策',
  CITY_MANAGER: '主理人',
  USER: '用户',
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'ADMIN', className: 'bg-red-100 text-red-700 border-red-200' },
  MODERATOR: { label: 'MOD', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  CITY_MANAGER: { label: '主理人', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  USER: { label: '用户', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${min}`
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export function LogsClient({ role, selfId }: LogsClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [filterUserId, setFilterUserId] = useState('')
  const [filterTargetType, setFilterTargetType] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<{
    userId: string; targetType: string; action: string; from: string; to: string; page: number
  }>({ userId: '', targetType: '', action: '', from: '', to: '', page: 1 })

  const fetchLogs = useCallback(async (filters: typeof appliedFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(filters.page))
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.targetType) params.set('targetType', filters.targetType)
      if (filters.action) params.set('action', filters.action)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      const res = await fetch(`/api/admin/logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(appliedFilters)
  }, [fetchLogs, appliedFilters])

  function handleQuery() {
    setAppliedFilters({
      userId: filterUserId.trim(),
      targetType: filterTargetType,
      action: filterAction,
      from: filterFrom,
      to: filterTo,
      page: 1,
    })
    setExpandedId(null)
  }

  function handleReset() {
    setFilterUserId('')
    setFilterTargetType('')
    setFilterAction('')
    setFilterFrom('')
    setFilterTo('')
    setAppliedFilters({ userId: '', targetType: '', action: '', from: '', to: '', page: 1 })
    setExpandedId(null)
  }

  function goToPage(page: number) {
    setAppliedFilters(prev => ({ ...prev, page }))
    setExpandedId(null)
  }

  const isAdmin = role === 'ADMIN' || role === 'MODERATOR'

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="bg-white rounded-2xl border border-hairline p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-mute mb-1">操作人 ID</label>
              <input
                type="text"
                value={filterUserId}
                onChange={e => setFilterUserId(e.target.value)}
                placeholder="userId"
                className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-mute mb-1">对象类型</label>
            <select
              value={filterTargetType}
              onChange={e => setFilterTargetType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
            >
              <option value="">全部</option>
              {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">操作类型</label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
            >
              <option value="">全部</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">开始日期</label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">结束日期</label>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleQuery} size="sm">查询</Button>
          <Button onClick={handleReset} variant="outline" size="sm">重置</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-mute text-sm">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-mute text-sm">暂无操作记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-hairline">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">时间</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">操作人</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">操作</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">对象类型</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">对象名称</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-mute whitespace-nowrap">变更详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const roleBadge = ROLE_BADGE[log.userRole] ?? ROLE_BADGE.USER
                  const isExpanded = expandedId === log.id
                  const hasChanges = log.changes && Object.keys(log.changes).length > 0

                  return (
                    <>
                      <tr
                        key={log.id}
                        className="border-b border-hairline last:border-0 hover:bg-surface-soft/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-mute whitespace-nowrap font-mono">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-ink">{log.userName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${roleBadge.className}`}>
                              {roleBadge.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-ink">
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-mute">
                            {TARGET_TYPE_LABELS[log.targetType] ?? log.targetType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink max-w-[160px]">
                          {truncate(log.targetName, 20)}
                        </td>
                        <td className="px-4 py-3">
                          {hasChanges ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {isExpanded ? '收起' : '查看'}
                            </button>
                          ) : (
                            <span className="text-sm text-ash">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasChanges && (
                        <tr key={`${log.id}-expand`} className="bg-surface-soft border-b border-hairline">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="rounded-xl border border-hairline bg-white overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-hairline bg-surface-soft">
                                    <th className="text-left px-3 py-2 font-medium text-mute w-1/4">字段</th>
                                    <th className="text-left px-3 py-2 font-medium text-mute w-[37.5%]">变更前</th>
                                    <th className="text-left px-3 py-2 font-medium text-mute w-[37.5%]">变更后</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(log.changes!).map(([field, change]) => (
                                    <tr key={field} className="border-b border-hairline last:border-0">
                                      <td className="px-3 py-2 font-mono text-ash">{field}</td>
                                      <td className="px-3 py-2 text-red-600 break-all">
                                        {formatValue(change.before)}
                                      </td>
                                      <td className="px-3 py-2 text-emerald-700 break-all">
                                        {formatValue(change.after)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-mute">
          <span>第 {pagination.page} 页 / 共 {pagination.totalPages} 页（{pagination.total} 条）</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
