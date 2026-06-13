import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

type Params = { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const manager = await prisma.cityManager.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true, name: true, username: true } },
    },
  })

  if (!manager) return NextResponse.json({ error: '主理人不存在' }, { status: 404 })
  return NextResponse.json(manager)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  try {
    const existing = await prisma.cityManager.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: '主理人不存在' }, { status: 404 })

    const body = await request.json()
    const {
      name, avatar, title, bio, quote, focusTags,
      wechat, scope, city, province, order, status, userId,
    } = body

    const changes: Record<string, { from: unknown; to: unknown }> = {}
    const trackFields = ['name', 'title', 'scope', 'city', 'province', 'status', 'order'] as const
    for (const field of trackFields) {
      if (body[field] !== undefined && (existing as any)[field] !== body[field]) {
        changes[field] = { from: (existing as any)[field], to: body[field] }
      }
    }

    // Handle userId change (bind/unbind)
    const oldUserId = existing.userId
    const newUserId = userId !== undefined ? userId || null : existing.userId

    if (oldUserId !== newUserId) {
      // Unbind old user → downgrade role back to USER (unless ADMIN/MODERATOR)
      if (oldUserId) {
        const oldUser = await prisma.user.findUnique({ where: { id: oldUserId }, select: { role: true } })
        if (oldUser && oldUser.role === 'CITY_MANAGER') {
          await prisma.user.update({ where: { id: oldUserId }, data: { role: 'USER' } })
        }
      }
      // Bind new user → upgrade to CITY_MANAGER unless ADMIN
      if (newUserId) {
        const newUser = await prisma.user.findUnique({ where: { id: newUserId }, select: { role: true } })
        if (newUser && newUser.role !== 'ADMIN') {
          await prisma.user.update({ where: { id: newUserId }, data: { role: 'CITY_MANAGER' } })
        }
      }
      changes['userId'] = { from: oldUserId, to: newUserId }
    }

    const manager = await prisma.cityManager.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
        ...(title !== undefined ? { title: title || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(quote !== undefined ? { quote: quote || null } : {}),
        ...(focusTags !== undefined ? { focusTags } : {}),
        ...(wechat !== undefined ? { wechat: wechat || null } : {}),
        ...(scope !== undefined ? { scope } : {}),
        ...(city !== undefined ? { city: city || null } : {}),
        ...(province !== undefined ? { province } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(userId !== undefined ? { userId: userId || null } : {}),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || admin.username,
        userRole: admin.role,
        action: Object.keys(changes).length === 1 && 'status' in changes ? 'STATUS_CHANGE' : 'UPDATE',
        targetType: 'CITY_MANAGER',
        targetId: manager.id,
        targetName: manager.name,
        changes: Object.keys(changes).length > 0 ? JSON.parse(JSON.stringify(changes)) : undefined,
      },
    })

    revalidatePath('/about')
    revalidatePath('/local')
    return NextResponse.json(manager)
  } catch (error) {
    console.error('更新主理人失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  try {
    const existing = await prisma.cityManager.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: '主理人不存在' }, { status: 404 })

    // Downgrade bound user if CITY_MANAGER
    if (existing.userId) {
      const user = await prisma.user.findUnique({ where: { id: existing.userId }, select: { role: true } })
      if (user && user.role === 'CITY_MANAGER') {
        await prisma.user.update({ where: { id: existing.userId }, data: { role: 'USER' } })
      }
    }

    await prisma.cityManager.delete({ where: { id: params.id } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || admin.username,
        userRole: admin.role,
        action: 'DELETE',
        targetType: 'CITY_MANAGER',
        targetId: params.id,
        targetName: existing.name,
        changes: undefined,
      },
    })

    revalidatePath('/about')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除主理人失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
