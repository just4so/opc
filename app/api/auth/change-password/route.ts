import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: '新密码至少 6 位' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json({ error: '请输入当前密码' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })

  return NextResponse.json({ success: true })
}
