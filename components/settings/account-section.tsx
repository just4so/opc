'use client'

import { useEffect, useState } from 'react'
import { Mail, Lock, Bell, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-notification'

export function AccountSection() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [sendingVerify, setSendingVerify] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setEmail(data.email)
        setEmailVerified(data.emailVerified)
        setEmailNotifications(data.emailNotifications ?? true)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleSendVerify = async () => {
    setSendingVerify(true)
    try {
      const res = await fetch('/api/auth/send-verify-email', { method: 'POST' })
      if (res.ok) {
        setVerifySent(true)
        toast('验证邮件已发送', 'success')
      } else {
        const data = await res.json()
        toast(data.error || '发送失败', 'error')
      }
    } catch {
      toast('网络错误', 'error')
    } finally {
      setSendingVerify(false)
    }
  }

  const handleToggleNotifications = async () => {
    const newVal = !emailNotifications
    setEmailNotifications(newVal)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: newVal }),
      })
      if (res.ok) {
        toast(newVal ? '邮件通知已开启' : '邮件通知已关闭', 'success')
      } else {
        setEmailNotifications(!newVal)
      }
    } catch {
      setEmailNotifications(!newVal)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast('新密码至少 6 位', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('两次密码输入不一致', 'error')
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast('密码修改成功', 'success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast(data.error || '修改失败', 'error')
      }
    } catch {
      toast('网络错误', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-mute">加载中...</div>

  return (
    <div className="space-y-6">
      {/* Email verification */}
      <div className="bg-white rounded-2xl p-6 border border-hairline">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
          <Mail className="h-4 w-4 text-primary" />
          邮箱验证
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-charcoal">
              {email || '未绑定'}
              {email && (
                emailVerified ? (
                  <span className="ml-2 inline-flex items-center text-xs text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5 mr-0.5" />已验证
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center text-xs text-primary">
                    <AlertCircle className="h-3.5 w-3.5 mr-0.5" />未验证
                  </span>
                )
              )}
            </p>
          </div>
          {email && !emailVerified && (
            verifySent ? (
              <p className="text-sm text-emerald-700">已发送，请检查收件箱</p>
            ) : (
              <Button variant="outline" size="sm" onClick={handleSendVerify} disabled={sendingVerify}>
                {sendingVerify ? '发送中...' : '发送验证邮件'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl p-6 border border-hairline">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
          <Lock className="h-4 w-4 text-primary" />
          修改密码
        </h3>
        <div className="space-y-3 max-w-sm">
          <Input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="当前密码（首次设置可留空）"
          />
          <Input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="新密码（至少 6 位）"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
          />
          <Button size="sm" onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
            {changingPassword ? '修改中...' : '修改密码'}
          </Button>
        </div>
      </div>

      {/* Email notifications */}
      <div className="bg-white rounded-2xl p-6 border border-hairline">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
          <Bell className="h-4 w-4 text-primary" />
          邮件通知
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">接收邮件通知</p>
            <p className="text-xs mt-0.5 text-ash">关注、评论等互动会通过邮件通知你</p>
          </div>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: emailNotifications ? 'var(--color-primary)' : '#c8c8c1' }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: emailNotifications ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
