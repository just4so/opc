import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const { status, featured } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (typeof featured === 'boolean') updateData.featured = featured

    const order = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('更新订单失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.project.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除订单失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
