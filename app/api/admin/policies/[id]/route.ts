import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi, isInScope } from '@/lib/admin'
import prisma from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  if (staff.role === 'CITY_MANAGER') {
    const existing = await prisma.policy.findUnique({
      where: { id: params.id },
      select: { city: true },
    })
    if (!existing) return NextResponse.json({ error: '政策不存在' }, { status: 404 })
    if (!isInScope(staff, existing.city)) {
      return NextResponse.json({ error: '无权操作该城市的数据' }, { status: 403 })
    }
  }

  const body = await req.json()
  const { province, city, district, title, summary, sourceUrl, status } = body

  const policy = await prisma.policy.update({
    where: { id: params.id },
    data: {
      ...(province !== undefined && { province }),
      ...(city !== undefined && { city: city || null }),
      ...(district !== undefined && { district: district || null }),
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(sourceUrl !== undefined && { sourceUrl: sourceUrl || null }),
      ...(status !== undefined && { status }),
    },
  })

  return NextResponse.json(policy)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  if (staff.role === 'CITY_MANAGER') {
    return NextResponse.json({ error: '无权删除政策' }, { status: 403 })
  }

  await prisma.policy.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
