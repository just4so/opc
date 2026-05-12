import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireStaff()

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
  await requireStaff()

  await prisma.policy.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
