import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi } from '@/lib/admin'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await requireStaffContextApi()
  if (ctx instanceof NextResponse) return ctx

  if (ctx.role !== 'CITY_MANAGER') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const manager = await prisma.cityManager.findUnique({
    where: { userId: ctx.id },
  })

  return NextResponse.json({ manager: manager ?? null })
}

export async function PUT(request: NextRequest) {
  const ctx = await requireStaffContextApi()
  if (ctx instanceof NextResponse) return ctx

  if (ctx.role !== 'CITY_MANAGER') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const manager = await prisma.cityManager.findUnique({
    where: { userId: ctx.id },
  })
  if (!manager) {
    return NextResponse.json({ error: '未找到主理人记录' }, { status: 404 })
  }

  const body = await request.json()
  const { name, avatar, title, bio, quote, focusTags, wechat } = body

  const updated = await prisma.cityManager.update({
    where: { id: manager.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(avatar !== undefined ? { avatar: avatar || null } : {}),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(quote !== undefined ? { quote: quote || null } : {}),
      ...(focusTags !== undefined ? { focusTags } : {}),
      ...(wechat !== undefined ? { wechat: wechat || null } : {}),
    },
  })

  revalidatePath('/about')
  revalidatePath('/local')

  return NextResponse.json({ manager: updated })
}
