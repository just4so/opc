import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (currentUser.name !== null) {
      return NextResponse.json({ error: '昵称已设置，不可修改' }, { status: 400 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (name.length < 2 || name.length > 20) {
      return NextResponse.json({ error: '昵称需为 2-20 个字符' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: '昵称已被使用' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { name: true },
    })

    return NextResponse.json({ name: user.name })
  } catch (error) {
    console.error('设置昵称失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
