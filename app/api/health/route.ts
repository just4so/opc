import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db: dbMs,
      ts: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: (error as Error).message },
      { status: 503 }
    )
  }
}
