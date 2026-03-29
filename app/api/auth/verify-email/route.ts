import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: '缺少验证参数' }, { status: 400 })
  }

  const record = await prisma.oneTimeToken.findUnique({ where: { token } })

  if (
    !record ||
    record.type !== 'email_verify' ||
    record.usedAt !== null ||
    record.expiresAt < new Date()
  ) {
    return NextResponse.json({ error: '验证链接已过期，请重新发送' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
    prisma.oneTimeToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ message: '邮箱验证成功' })
}
