'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'

interface EmailPreferencesProps {
  initialEnabled: boolean
}

export function EmailPreferences({ initialEnabled }: EmailPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleToggle = async () => {
    const newValue = !enabled
    setEnabled(newValue)
    setSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: newValue }),
      })
      if (res.ok) {
        toast(newValue ? '邮件通知已开启' : '邮件通知已关闭', 'success')
      } else {
        setEnabled(!newValue)
        toast('保存失败', 'error')
      }
    } catch {
      setEnabled(!newValue)
      toast('网络错误', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #dadad3' }}>
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#000' }}>
        <Mail className="h-4 w-4" style={{ color: '#F97316' }} />
        邮件通知
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: '#33332e' }}>接收邮件通知</p>
          <p className="text-xs mt-0.5" style={{ color: '#91918c' }}>
            关注、评论等互动会通过邮件通知你
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
          style={{ backgroundColor: enabled ? '#F97316' : '#c8c8c1' }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
            style={{ transform: enabled ? 'translateX(24px)' : 'translateX(4px)' }}
          />
        </button>
      </div>
    </div>
  )
}
