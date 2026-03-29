import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { sendEmailVerifyEmail } from '@/lib/mailer'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  if (!user.email) return NextResponse.json({ error: '请先绑定邮箱' }, { status: 400 })
  if (user.emailVerified) return NextResponse.json({ error: '邮箱已完成验证' }, { status: 400 })

  // Rate limit: max 5 sends per 24 hours
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentCount = await prisma.oneTimeToken.count({
    where: {
      userId: user.id,
      type: 'email_verify',
      createdAt: { gte: dayAgo },
    },
  })
  if (recentCount >= 5) {
    return NextResponse.json({ error: '今日发送次数已达上限，请明天再试' }, { status: 429 })
  }

  // Invalidate old unused tokens
  await prisma.oneTimeToken.updateMany({
    where: { userId: user.id, type: 'email_verify', usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.oneTimeToken.create({
    data: { userId: user.id, type: 'email_verify', token, expiresAt },
  })

  sendEmailVerifyEmail(user.email, token).catch(console.error)

  return NextResponse.json({ message: '验证邮件已发送，请检查收件箱' })
}
