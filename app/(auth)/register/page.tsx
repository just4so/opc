'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const [username, setUsername] = useState('')
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
        body: JSON.stringify({ username, phone, email: email || undefined, password, startupStage, mainTrack }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '注册失败')
        return
      }

      router.push('/login?registered=true')
    } catch (err) {
      setError('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold text-primary">OPC</span>
            <span className="text-xl font-semibold text-secondary">创业圈</span>
          </Link>
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            创建账户，加入 OPC 创业圈社区
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
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                用户名
              </label>
              <Input
                id="username"
                type="text"
                placeholder="你的用户名（2-20个字符）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
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
              <p className="text-xs text-gray-400">手机号可用于登录，不做短信验证</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                邮箱 <span className="text-gray-400 font-normal">（选填）</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
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
              <p className="text-xs text-gray-500 mb-3">
                以下信息帮助我们为你匹配最合适的社区和资源（选填，30秒）
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
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
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <label className="text-sm font-medium text-gray-700">
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
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
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

          <div className="mt-6 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
