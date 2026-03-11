'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Shield, ShieldCheck, User as UserIcon, Download, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  username: string
  email: string | null
  name: string | null
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  level: number
  verified: boolean
  mainTrack: string | null
  startupStage: string | null
  createdAt: string
  _count: {
    posts: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  USER: { label: '用户', color: 'bg-gray-100 text-gray-800' },
  MODERATOR: { label: '版主', color: 'bg-blue-100 text-blue-800' },
  ADMIN: { label: '管理员', color: 'bg-red-100 text-red-800' },
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('获取用户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('更新角色失败:', error)
    }
  }

  const handleVerifyToggle = async (userId: string, currentVerified: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified }),
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('更新认证状态失败:', error)
    }
  }

  const handleExport = () => {
    window.open('/api/admin/export?type=users', '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">用户管理</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出数据
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索用户名、昵称、邮箱..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button type="submit">搜索</Button>
            </form>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">全部角色</option>
              <option value="USER">用户</option>
              <option value="MODERATOR">版主</option>
              <option value="ADMIN">管理员</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            用户列表
            {pagination && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                共 {pagination.total} 个用户
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">用户</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">邮箱</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">角色</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">等级</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">认证</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">赛道</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">阶段</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">动态数</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">注册时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-sm font-semibold">
                            {user.name?.[0] || user.username[0]}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || user.username}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.email || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded ${ROLE_LABELS[user.role].color}`}
                        >
                          <option value="USER">用户</option>
                          <option value="MODERATOR">版主</option>
                          <option value="ADMIN">管理员</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">Lv.{user.level}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleVerifyToggle(user.id, user.verified)}
                          className={`flex items-center gap-1 text-sm ${
                            user.verified ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {user.verified ? (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              已认证
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4" />
                              未认证
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.mainTrack || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.startupStage || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user._count.posts}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'yyyy-MM-dd')}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="ghost" asChild title="查看Ta的动态">
                          <a href={`/admin/users/${user.id}`}>
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                第 {page} / {pagination.totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
