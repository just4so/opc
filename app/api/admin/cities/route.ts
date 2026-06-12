import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

export async function GET() {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const rows = await prisma.$queryRaw<{ city: string }[]>`
    SELECT DISTINCT city FROM "Community" WHERE city IS NOT NULL AND city != '' ORDER BY city
  `

  return NextResponse.json({ cities: rows.map((r) => r.city) })
}
