'use client'

import { useEffect, useState, useCallback } from 'react'
import { BadgeCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type VerifyType = 'IDENTITY' | 'ENTREPRENEUR' | 'EXPERT' | 'COMMUNITY'

const VERIFY_TYPE_LABELS: Record<VerifyType, string> = {
  IDENTITY: '身份认证',
  ENTREPRENEUR: '创业者认证',
  EXPERT: '专家认证',
  COMMUNITY: '社区认证',
}

const VERIFY_TYPES: VerifyType[] = ['IDENTITY', 'ENTREPRENEUR', 'EXPERT', 'COMMUNITY']

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
  const [updating, setUpdating] = useState<string | null>(null)
  const [dialogUser, setDialogUser] = useState<PlazaUser | null>(null)
  const [selectedType, setSelectedType] = useState<VerifyType>('ENTREPRENEUR')
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

  async function handleVerify(userId: string, verifyType: VerifyType) {
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/verify/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true, verifyType }),
      })
      if (res.ok) {
        setDialogUser(null)
        await fetchUsers()
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null)
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm('确认取消该用户的认证？')) return
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/verify/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: false }),
      })
      if (res.ok) await fetchUsers()
    } catch {
      // silently fail
    } finally {
      setUpdating(null)
    }
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
                        <div className="font-medium text-gray-900 truncate">{user.name || user.username}</div>
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
                    {user.verified ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === user.id}
                        onClick={() => handleRevoke(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        取消认证
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={updating === user.id}
                        onClick={() => { setDialogUser(user); setSelectedType('ENTREPRENEUR') }}
                      >
                        认证
                      </Button>
                    )}
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

      {/* Verify Dialog */}
      {dialogUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setDialogUser(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">认证用户</h3>
              <button onClick={() => setDialogUser(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              为 <strong>{dialogUser.name || dialogUser.username}</strong> 选择认证类型：
            </p>
            <div className="space-y-2 mb-6">
              {VERIFY_TYPES.map(vt => (
                <label
                  key={vt}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedType === vt ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="verifyType"
                    value={vt}
                    checked={selectedType === vt}
                    onChange={() => setSelectedType(vt)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{VERIFY_TYPE_LABELS[vt]}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogUser(null)}>取消</Button>
              <Button
                disabled={updating === dialogUser.id}
                onClick={() => handleVerify(dialogUser.id, selectedType)}
              >
                {updating === dialogUser.id ? '处理中...' : '确认认证'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
