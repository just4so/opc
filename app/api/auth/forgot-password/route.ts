import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/mailer'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const { success } = rateLimit(`forgot:${ip}`, 5, 10 * 60 * 1000)
  if (!success) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
  }

  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // 不暴露用户是否存在，统一返回成功
    return NextResponse.json({ message: '如果该邮箱已注册，重置邮件已发送，请检查收件箱' })
  }

  // Rate limit: max 3 requests per 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.oneTimeToken.count({
    where: {
      userId: user.id,
      type: 'password_reset',
      createdAt: { gte: tenMinutesAgo },
    },
  })
  if (recentCount >= 3) {
    return NextResponse.json({ error: '发送过于频繁，请 10 分钟后再试' }, { status: 429 })
  }

  // Invalidate all unused old tokens
  await prisma.oneTimeToken.updateMany({
    where: { userId: user.id, type: 'password_reset', usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.oneTimeToken.create({
    data: { userId: user.id, type: 'password_reset', token, expiresAt },
  })

  // Fire and forget
  sendPasswordResetEmail(email, token).catch(console.error)

  return NextResponse.json({ message: '如果该邮箱已注册，重置邮件已发送，请检查收件箱' })
}
