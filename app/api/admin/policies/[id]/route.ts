import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi, isInScope } from '@/lib/admin'
import prisma from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  const existing = await prisma.policy.findUnique({
    where: { id: params.id },
  })
  if (!existing) return NextResponse.json({ error: '政策不存在' }, { status: 404 })

  if (staff.role === 'CITY_MANAGER') {
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

  const changes: Record<string, { from: unknown; to: unknown }> = {}
  if (title !== undefined && title !== existing.title) changes.title = { from: existing.title, to: title }
  if (status !== undefined && status !== existing.status) changes.status = { from: existing.status, to: status }
  if (province !== undefined && province !== existing.province) changes.province = { from: existing.province, to: province }
  if (city !== undefined && (city || null) !== existing.city) changes.city = { from: existing.city, to: city || null }

  prisma.auditLog.create({
    data: {
      userId: staff.id,
      userName: staff.name || staff.username,
      userRole: staff.role,
      action: Object.keys(changes).length === 1 && 'status' in changes ? 'STATUS_CHANGE' : 'UPDATE',
      targetType: 'POLICY',
      targetId: policy.id,
      targetName: policy.title,
      changes: Object.keys(changes).length > 0 ? JSON.parse(JSON.stringify(changes)) : null,
    },
  }).catch(console.error)

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

  const existing = await prisma.policy.findUnique({
    where: { id: params.id },
    select: { title: true },
  })
  if (!existing) return NextResponse.json({ error: '政策不存在' }, { status: 404 })

  await prisma.policy.delete({ where: { id: params.id } })

  prisma.auditLog.create({
    data: {
      userId: staff.id,
      userName: staff.name || staff.username,
      userRole: staff.role,
      action: 'DELETE',
      targetType: 'POLICY',
      targetId: params.id,
      targetName: existing.title,
      changes: undefined,
    },
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
