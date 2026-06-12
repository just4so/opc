import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const LIMIT = 50

export async function GET(request: NextRequest) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const userId = searchParams.get('userId')
  const targetType = searchParams.get('targetType')
  const action = searchParams.get('action')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = {}

  if (staff.role === 'CITY_MANAGER') {
    where.userId = staff.id
  } else {
    if (userId) where.userId = userId
  }

  if (targetType) where.targetType = targetType
  if (action) where.action = action
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from)
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to + 'T23:59:59Z')
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    pagination: { page, limit: LIMIT, total, totalPages: Math.ceil(total / LIMIT) },
  })
}
