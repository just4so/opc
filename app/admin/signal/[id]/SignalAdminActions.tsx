'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  id: string
  issueNo: number
  status: string
}

export default function SignalAdminActions({ id, issueNo, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleStatusChange(newStatus: 'PUBLISHED' | 'DRAFT') {
    setLoading(true)
    try {
      await fetch(`/api/admin/signal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/admin/signal/${id}`, { method: 'DELETE' })
      router.push('/admin/signal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link
        href="/admin/signal"
        className="text-sm text-mute hover:text-ink transition-colors"
      >
        ← 返回列表
      </Link>

      <div className="flex-1" />

      {/* Status badge */}
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'PUBLISHED'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {status === 'PUBLISHED' ? '已发布' : '草稿'}
      </span>

      {/* Publish button (DRAFT only) */}
      {status === 'DRAFT' && (
        <Button
          onClick={() => handleStatusChange('PUBLISHED')}
          disabled={loading}
          size="sm"
        >
          发布
        </Button>
      )}

      {/* Unpublish button (PUBLISHED only) */}
      {status === 'PUBLISHED' && (
        <Button
          onClick={() => handleStatusChange('DRAFT')}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          下架
        </Button>
      )}

      {/* View public link (PUBLISHED) */}
      {status === 'PUBLISHED' && (
        <Link
          href={`/news/signal/${issueNo}`}
          target="_blank"
          className="text-sm text-primary hover:underline"
        >
          查看前台 →
        </Link>
      )}

      {/* Delete */}
      {!confirmDelete ? (
        <Button
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          删除
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600">确认删除？</span>
          <Button
            onClick={handleDelete}
            disabled={loading}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            确认
          </Button>
          <Button
            onClick={() => setConfirmDelete(false)}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            取消
          </Button>
        </div>
      )}
    </div>
  )
}
