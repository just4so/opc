import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, '密码至少6位'),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || '参数错误'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { token, password } = parsed.data

  const record = await prisma.oneTimeToken.findUnique({ where: { token } })
  if (
    !record ||
    record.type !== 'password_reset' ||
    record.usedAt !== null ||
    record.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: '重置链接已过期或已使用，请重新申请' },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.oneTimeToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  // 查询 phone/email 供前端自动登录（phone 优先，无 phone 则用 email）
  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { phone: true, email: true },
  })
  const identifier = user?.phone ?? user?.email ?? ''
  return NextResponse.json({ message: '密码重置成功', identifier })
}
