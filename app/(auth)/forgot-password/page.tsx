'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 404 && data.notRegistered) {
          setError('__NOT_REGISTERED__')
        } else {
          setError(data.error || '发送失败，请稍后重试')
        }
      } else {
        setSubmitted(true)
        setCooldown(600)
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0 }
            return c - 1
          })
        }, 1000)
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌 Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-orange-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="text-5xl font-bold mb-2">OPC</div>
          <div className="text-2xl font-semibold mb-8 opacity-90">圈</div>
          <p className="text-lg font-medium mb-8 leading-relaxed opacity-95">
            让 AI 创业者<br />不再孤独前行
          </p>
        </div>
      </div>
      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-bold text-primary">OPC</span>
                <span className="text-xl font-semibold text-secondary">圈</span>
              </Link>
              <CardTitle className="text-2xl">找回密码</CardTitle>
              <CardDescription>
                输入注册时使用的邮箱，我们将发送重置链接
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-700 px-4 py-4 rounded-md text-sm">
                    <p className="font-medium mb-1">✅ 重置邮件已发送</p>
                    <p>请检查 <strong>{email}</strong> 的收件箱（包括垃圾邮件箱）</p>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    没收到？{' '}
                    {cooldown > 0 ? (
                      <span className="text-gray-400">
                        {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')} 后可重新发送
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        className="text-primary hover:underline"
                      >
                        重新发送
                      </button>
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className={`px-4 py-3 rounded-md text-sm ${error === '__NOT_REGISTERED__' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-600'}`}>
                      {error === '__NOT_REGISTERED__' ? (
                        <p>该邮箱尚未注册。<Link href="/register" className="font-medium underline hover:no-underline">立即创建账号 →</Link></p>
                      ) : (
                        error
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      邮箱地址
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="输入注册邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '发送中...' : '发送重置邮件'}
                  </Button>
                </form>
              )}
              <div className="mt-6 text-center text-sm text-gray-600">
                <Link href="/login" className="text-primary hover:underline">
                  返回登录
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
