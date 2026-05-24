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
        <div className="max-w-sm text-center">
          <img src="/logo-transparent.png" alt="OPC圈" className="h-16 mb-8" />
          <p className="text-lg font-medium mb-8 leading-relaxed opacity-95">
            让 AI 创业者<br />不再孤独前行
          </p>
          <ul className="space-y-3 text-left text-sm opacity-90">
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              全国 180+ 个 OPC 社区攻略
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              精确到联系方式和入驻条件
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              创业者广场，找人找合作
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              最新 OPC 政策解读
            </li>
          </ul>
        </div>
      </div>
      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-soft">
        <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-transparent.png" alt="OPC圈" className="h-8" />
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
