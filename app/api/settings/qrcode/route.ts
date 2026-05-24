import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 3600

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'community_qrcode_url' },
  })

  return NextResponse.json({ url: setting?.value || null })
}
