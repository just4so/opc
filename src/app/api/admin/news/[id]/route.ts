import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const { isOriginal, author } = body

    const updateData: Record<string, unknown> = {}
    if (typeof isOriginal === 'boolean') updateData.isOriginal = isOriginal
    if (typeof author === 'string') updateData.author = author

    const news = await prisma.news.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('更新资讯失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.news.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('删除资讯失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
