import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireStaff()

  const { searchParams } = new URL(req.url)
  const province = searchParams.get('province') || ''
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (province) where.province = province
  if (status) where.status = status

  const [policies, total, provinces] = await Promise.all([
    prisma.policy.findMany({
      where,
      orderBy: [{ province: 'asc' }, { city: 'asc' }, { district: 'asc' }],
    }),
    prisma.policy.count({ where }),
    prisma.policy.findMany({
      select: { province: true },
      distinct: ['province'],
      orderBy: { province: 'asc' },
    }),
  ])

  const cityCount = await prisma.policy.groupBy({
    by: ['city'],
    where: { city: { not: null } },
  })

  return NextResponse.json({
    policies,
    total,
    provinces: provinces.map((p) => p.province),
    cityCount: cityCount.length,
  })
}

export async function POST(req: NextRequest) {
  await requireStaff()

  const body = await req.json()
  const { province, city, district, title, summary, sourceUrl, status } = body

  if (!province || !title || !summary) {
    return NextResponse.json({ error: '省份、政策名称、摘要为必填项' }, { status: 400 })
  }

  const policy = await prisma.policy.create({
    data: {
      province,
      city: city || null,
      district: district || null,
      title,
      summary,
      sourceUrl: sourceUrl || null,
      status: status || 'ACTIVE',
    },
  })

  return NextResponse.json(policy, { status: 201 })
}
