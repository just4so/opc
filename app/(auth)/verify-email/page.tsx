'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { status } = useSession()

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMsg('缺少验证参数')
      return
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setState('error')
          setErrorMsg(data.error)
        } else {
          setState('success')
        }
      })
      .catch(() => {
        setState('error')
        setErrorMsg('网络错误，请稍后重试')
      })
  }, [token])

  const handleResend = async () => {
    if (status !== 'authenticated') return
    setResending(true)
    try {
      const res = await fetch('/api/auth/send-verify-email', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setResent(true)
      else setErrorMsg(data.error || '发送失败')
    } catch {
      setErrorMsg('网络错误，请稍后重试')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">OPC</span>
              <span className="text-xl font-semibold text-secondary">圈</span>
            </Link>
            <CardTitle className="text-2xl">
              {state === 'loading' ? '验证中...' : state === 'success' ? '邮箱验证成功' : '验证失败'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {state === 'loading' && (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {state === 'success' && (
              <>
                <div className="text-5xl mb-2">✅</div>
                <p className="text-gray-600">你的邮箱已成功验证！</p>
                <Link href="/">
                  <Button className="w-full">去首页</Button>
                </Link>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="text-5xl mb-2">❌</div>
                <p className="text-red-600">{errorMsg}</p>
                {resent ? (
                  <p className="text-green-600 text-sm">验证邮件已重新发送，请检查收件箱</p>
                ) : status === 'authenticated' ? (
                  <Button
                    onClick={handleResend}
                    disabled={resending}
                    variant="outline"
                    className="w-full"
                  >
                    {resending ? '发送中...' : '重新发送验证邮件'}
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    <Link href="/login" className="text-primary hover:underline">登录</Link>
                    {' '}后可重新发送验证邮件
                  </p>
                )}
                <Link href="/" className="block text-sm text-gray-500 hover:text-primary">
                  返回首页
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
