'use client'

import { useEffect, useState, useCallback } from 'react'
import { BadgeCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserDrawer } from '@/components/admin/user-drawer'

type VerifyType = 'IDENTITY' | 'ENTREPRENEUR' | 'EXPERT' | 'COMMUNITY'

const VERIFY_TYPE_LABELS: Record<VerifyType, string> = {
  IDENTITY: '身份认证',
  ENTREPRENEUR: '创业者认证',
  EXPERT: '专家认证',
  COMMUNITY: '社区认证',
}

interface PlazaUser {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  mainTrack: string | null
  location: string | null
  verified: boolean
  verifyType: VerifyType | null
  createdAt: string
}

type FilterTab = 'ALL' | 'VERIFIED' | 'UNVERIFIED'

export function VerifyClient() {
  const [users, setUsers] = useState<PlazaUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('ALL')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(tab !== 'ALL' && { filter: tab }),
      })
      const res = await fetch(`/api/admin/verify?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, tab])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function handleTabChange(newTab: FilterTab) {
    setTab(newTab)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const TABS: { label: string; value: FilterTab }[] = [
    { label: '全部', value: 'ALL' },
    { label: '已认证', value: 'VERIFIED' },
    { label: '未认证', value: 'UNVERIFIED' },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {TABS.map(t => (
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">用户</th>
                <th className="pb-3 pr-4 font-medium">简介</th>
                <th className="pb-3 pr-4 font-medium">方向</th>
                <th className="pb-3 pr-4 font-medium">城市</th>
                <th className="pb-3 pr-4 font-medium">注册时间</th>
                <th className="pb-3 pr-4 font-medium">认证状态</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {user.name?.[0] || user.username[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <button
                          className="font-medium text-gray-900 truncate hover:text-primary transition-colors text-left"
                          onClick={() => setDrawerUserId(user.id)}
                        >
                          {user.name || user.username}
                        </button>
                        <div className="text-xs text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 max-w-[180px] truncate">{user.bio || '-'}</td>
                  <td className="py-3 pr-4 text-gray-600">{user.mainTrack || '-'}</td>
                  <td className="py-3 pr-4 text-gray-600">{user.location || '-'}</td>
                  <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 pr-4">
                    {user.verified ? (
                      <Badge className="bg-blue-100 text-blue-800 gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        {VERIFY_TYPE_LABELS[user.verifyType!] || '已认证'}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500">未认证</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDrawerUserId(user.id)}
                    >
                      详情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500">
            共 {total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              上一页
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* User Drawer */}
      <UserDrawer
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
        onSaved={() => fetchUsers()}
      />
    </div>
  )
}
