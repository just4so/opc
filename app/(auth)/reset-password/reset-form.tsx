'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '重置失败，请重新申请')
      } else {
        // Auto sign-in after reset
        const loginResult = await signIn('credentials', {
          email: data.identifier,
          password,
          redirect: false,
        })
        if (!loginResult?.error) {
          router.push('/')
        } else {
          router.push('/login?message=reset-success')
        }
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="inline-block mb-4">
          <span className="text-2xl font-bold text-primary">OPC</span>
          <span className="text-xl font-semibold text-secondary">圈</span>
        </Link>
        <CardTitle className="text-2xl">设置新密码</CardTitle>
        <CardDescription>请输入你的新密码</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              新密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="至少6位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium text-gray-700">
              确认密码
            </label>
            <Input
              id="confirm"
              type="password"
              placeholder="再次输入新密码"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '重置中...' : '确认重置'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="text-primary hover:underline">
            返回登录
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
