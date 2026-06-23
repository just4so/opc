'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Policy {
  id: string
  province: string
  city: string | null
  district: string | null
  title: string
  summary: string
  sourceUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: '已发布', className: 'bg-green-100 text-green-800' },
  DRAFT: { label: '征求意见', className: 'bg-yellow-100 text-yellow-800' },
  EXPIRED: { label: '已过期', className: 'bg-gray-100 text-gray-800' },
}

interface PoliciesClientProps {
  policies: Policy[]
  provinces: string[]
  currentProvince: string
  currentStatus: string
}

export default function PoliciesClient({
  policies: initialPolicies,
  provinces,
  currentProvince,
  currentStatus,
}: PoliciesClientProps) {
  const router = useRouter()
  const [policies, setPolicies] = useState(initialPolicies)

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams()
    if (e.target.value) params.set('province', e.target.value)
    if (currentStatus) params.set('status', currentStatus)
    router.push(`/admin/policies?${params.toString()}`)
    router.refresh()
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams()
    if (currentProvince) params.set('province', currentProvince)
    if (e.target.value) params.set('status', e.target.value)
    router.push(`/admin/policies?${params.toString()}`)
    router.refresh()
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除「${title}」吗？此操作不可恢复。`)) return

    const res = await fetch(`/api/admin/policies/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPolicies((prev) => prev.filter((p) => p.id !== id))
    }
  }

  return (
    <div>
      {/* 筛选 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={currentProvince}
          onChange={handleProvinceChange}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">全部省份</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={currentStatus}
          onChange={handleStatusChange}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">已发布</option>
          <option value="DRAFT">征求意见</option>
          <option value="EXPIRED">已过期</option>
        </select>

        {(currentProvince || currentStatus) && (
          <a
            href="/admin/policies"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
          >
            清除筛选
          </a>
        )}
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无政策数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500">省份</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">城市</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">区县</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">政策名称</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const badge = STATUS_BADGE[policy.status] || STATUS_BADGE.ACTIVE
                return (
                  <tr key={policy.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{policy.province}</td>
                    <td className="py-3 px-4 text-sm">{policy.city || '-'}</td>
                    <td className="py-3 px-4 text-sm">{policy.district || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">
                        {policy.title.length > 50
                          ? policy.title.slice(0, 50) + '…'
                          : policy.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {policy.summary}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/policies/${policy.id}/edit`}>
                          <Button variant="ghost" size="sm" title="编辑">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(policy.id, policy.title)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
