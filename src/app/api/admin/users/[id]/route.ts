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
    const { role, verified, level } = body

    const updateData: any = {}
    if (role) updateData.role = role
    if (typeof verified === 'boolean') updateData.verified = verified
    if (typeof level === 'number') updateData.level = level

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        verified: true,
        level: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
