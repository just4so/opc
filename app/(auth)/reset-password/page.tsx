import { Suspense } from 'react'
import prisma from '@/lib/db'
import Link from 'next/link'
import { ResetPasswordForm } from './reset-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  // Verify token server-side
  let valid = false
  if (token) {
    const record = await prisma.oneTimeToken.findUnique({ where: { token } })
    valid =
      !!record &&
      record.type === 'password_reset' &&
      record.usedAt === null &&
      record.expiresAt > new Date()
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-orange-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="text-5xl font-bold mb-2">OPC</div>
          <div className="text-2xl font-semibold mb-8 opacity-90">创业圈</div>
          <p className="text-lg font-medium leading-relaxed opacity-95">
            让 AI 创业者<br />不再孤独前行
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {!valid ? (
            <Card>
              <CardHeader className="text-center">
                <Link href="/" className="inline-block mb-4">
                  <span className="text-2xl font-bold text-primary">OPC</span>
                  <span className="text-xl font-semibold text-secondary">创业圈</span>
                </Link>
                <CardTitle className="text-2xl">链接已失效</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">此重置链接已过期或已使用，请重新申请。</p>
                <Link href="/forgot-password">
                  <Button className="w-full">重新申请重置密码</Button>
                </Link>
                <Link href="/login" className="block text-sm text-primary hover:underline">
                  返回登录
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Suspense fallback={null}>
              <ResetPasswordForm token={token!} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
