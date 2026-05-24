'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: identifier, // auth.ts 里用 email 字段接收，实际支持手机号/邮箱
        password,
        redirect: false,
      })

      if (result?.error) {
        const errorMessages: Record<string, string> = {
          'CredentialsSignin': '账号或密码错误',
          'Configuration': '账号或密码错误',
          'AccessDenied': '访问被拒绝',
          'Verification': '验证失败',
        }
        setError(errorMessages[result.error] || '登录失败，请稍后重试')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌 Panel（桌面端显示）*/}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-orange-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm flex flex-col items-center">
          <img src="/logo-wordmark-white.png" alt="OPC圈" className="h-10 mb-10" />
          <h2 className="text-2xl font-bold mb-3 text-center leading-snug">
            OPC创业者，在这里连接、让世界看见
          </h2>
          <p className="text-base opacity-90 mb-10 text-center leading-relaxed">
            全国 180+ 个 OPC 社区，真实信息人工核实，一键对接入驻
          </p>
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-3.5">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/></svg>
              </span>
              <span className="text-sm font-medium">找社区入驻，精确到联系方式</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-3.5">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span className="text-sm font-medium">展示产品，找到合作伙伴</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-3.5">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <span className="text-sm font-medium">认证创业者，被行业看见</span>
            </div>
          </div>
        </div>
      </div>
      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-soft">
        <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-transparent.png" alt="OPC圈" className="h-10" />
          </Link>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            登录你的账户，开始探索 OPC 社区
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium text-charcoal">
                手机号或邮箱
              </label>
              <Input
                id="identifier"
                type="text"
                placeholder="输入手机号或邮箱"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('请填写手机号或邮箱')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-charcoal">
                  密码
                </label>
                <Link href="/forgot-password" className="text-sm text-mute hover:text-primary">
                  忘记密码？
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('请填写密码')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-mute">
            还没有账户？{' '}
            <Link href={`/register${callbackUrl && callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-primary hover:underline">
              立即注册
            </Link>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginForm />
    </Suspense>
  )
}
