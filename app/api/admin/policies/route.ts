import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi, isInScope } from '@/lib/admin'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  const { searchParams } = new URL(req.url)
  const province = searchParams.get('province') || ''
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (province) where.province = province
  if (status) where.status = status

  // CITY_MANAGER: limit to own province + managed cities
  if (staff.managedCities !== null) {
    const scopeFilter = {
      OR: [
        { city: { in: staff.managedCities } },
        { province: staff.managerScope?.province ?? '__NONE__', city: null },
      ],
    }
    if (province || status) {
      Object.assign(where, scopeFilter)
    } else {
      Object.assign(where, scopeFilter)
    }
  }

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
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  const body = await req.json()
  const { province, city, district, title, summary, sourceUrl, status } = body

  if (!province || !title || !summary) {
    return NextResponse.json({ error: '省份、政策名称、摘要为必填项' }, { status: 400 })
  }

  if (staff.role === 'CITY_MANAGER') {
    if (!isInScope(staff, city || null)) {
      return NextResponse.json({ error: '只能在管辖城市内创建政策' }, { status: 403 })
    }
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
