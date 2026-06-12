import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await prisma.$queryRaw<{ city: string }[]>`
    SELECT DISTINCT city FROM "Community" WHERE city IS NOT NULL AND city != '' ORDER BY city
  `

  return NextResponse.json({ cities: rows.map((r) => r.city) })
}
