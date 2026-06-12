import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const province = searchParams.get('province')

  const managers = await prisma.cityManager.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as any } : {}),
      ...(province ? { province } : {}),
    },
    include: {
      user: { select: { id: true, email: true, name: true, username: true } },
    },
    orderBy: [{ order: 'desc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(managers)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await request.json()
    const {
      name, avatar, title, bio, quote, focusTags,
      wechat, scope, city, province, order, status, userId,
    } = body

    if (!name || !province) {
      return NextResponse.json({ error: '姓名和省份为必填项' }, { status: 400 })
    }

    const manager = await prisma.cityManager.create({
      data: {
        name,
        avatar: avatar || null,
        title: title || null,
        bio: bio || null,
        quote: quote || null,
        focusTags: focusTags || [],
        wechat: wechat || null,
        scope: scope || 'CITY',
        city: city || null,
        province,
        order: order ?? 0,
        status: status || 'ACTIVE',
        userId: userId || null,
      },
    })

    // Upgrade user role to CITY_MANAGER if bound and not already ADMIN/MODERATOR
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (user && user.role === 'USER') {
        await prisma.user.update({ where: { id: userId }, data: { role: 'CITY_MANAGER' } })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || admin.username,
        userRole: admin.role,
        action: 'CREATE',
        targetType: 'CITY_MANAGER',
        targetId: manager.id,
        targetName: manager.name,
        changes: undefined,
      },
    })

    revalidatePath('/about')
    return NextResponse.json(manager, { status: 201 })
  } catch (error) {
    console.error('创建主理人失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
