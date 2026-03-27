import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const old = searchParams.get('old')

  if (!old) {
    return NextResponse.json({ newSlug: null }, { status: 400 })
  }

  let decodedOld = old
  try {
    decodedOld = decodeURIComponent(old)
  } catch {
    // ignore malformed encoding, use raw value
  }

  const community = await prisma.community.findFirst({
    where: { slug: decodedOld },
    select: { newSlug: true },
  })

  return NextResponse.json({ newSlug: community?.newSlug ?? null })
}
