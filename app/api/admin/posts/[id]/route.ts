import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import prisma from '@/lib/db'

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
    const { status, pinned } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (typeof pinned === 'boolean') updateData.pinned = pinned

    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('更新动态失败:', error)
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

    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'DELETED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除动态失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
