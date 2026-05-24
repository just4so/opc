'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const STARTUP_STAGES = [
  { value: 'looking', label: '🔍 正在寻找 OPC 社区' },
  { value: 'settled', label: '🏠 已入驻 OPC 社区' },
  { value: 'considering', label: '🤔 考虑中，还在了解' },
  { value: 'other', label: '📌 其他' },
]

const MAIN_TRACKS = [
  { value: 'ai_product', label: 'AI 产品 / SaaS' },
  { value: 'design', label: '设计 / 创意服务' },
  { value: 'consulting', label: '咨询 / 知识服务' },
  { value: 'ecommerce', label: '电商 / 独立站' },
  { value: 'content', label: '内容创作 / 自媒体' },
  { value: 'dev', label: '独立开发 / 外包' },
  { value: 'other', label: '其他' },
]

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get('callbackUrl')
  const callbackUrl = rawCallbackUrl && rawCallbackUrl.startsWith('/') ? rawCallbackUrl : '/'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [startupStage, setStartupStage] = useState('')
  const [mainTrack, setMainTrack] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 昵称校验
    if (name.trim().length < 2) {
      setError('昵称至少2个字符')
      return
    }

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, password, startupStage, mainTrack }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '注册失败')
        return
      }

      // 注册成功，自动登录
      const loginResult = await signIn('credentials', {
        email: phone, // auth.ts 支持手机号查找
        password,
        redirect: false,
      })

      if (loginResult?.error) {
        // 自动登录失败，降级到手动登录页
        setError('注册成功！正在跳转到登录页...')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('注册失败，请稍后重试')
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
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            创建账户，加入 OPC圈社区
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
              <label htmlFor="name" className="text-sm font-medium text-charcoal">
                昵称 <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="你的昵称（2-20个字符）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-charcoal">
                手机号 <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="输入手机号（用于登录）"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                required
                maxLength={11}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-charcoal">
                邮箱 <span className="text-ash font-normal">（选填）</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="text-xs text-ash">📮 填写邮箱后可通过邮件找回密码</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-charcoal">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-charcoal">
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {/* 分隔线 */}
            <div className="border-t pt-4">
              <p className="text-xs text-mute mb-3">
                以下信息帮助我们为你匹配最合适的社区和资源（选填，30秒）
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">
                  你目前的入驻状态
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STARTUP_STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStartupStage(startupStage === s.value ? '' : s.value)}
                      className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                        startupStage === s.value
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-hairline-soft text-mute hover:border-hairline'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <label className="text-sm font-medium text-charcoal">
                  你的主要业务方向
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MAIN_TRACKS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMainTrack(mainTrack === t.value ? '' : t.value)}
                      className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                        mainTrack === t.value
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-hairline-soft text-mute hover:border-hairline'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册并加入'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-mute">
            已有账户？{' '}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
