import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const PUBLIC_KEYS = ['help_qrcode_url', 'community_qrcode_url']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key || !PUBLIC_KEYS.includes(key)) {
    return NextResponse.json({ error: '不支持的配置项' }, { status: 400 })
  }

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key } })
    return NextResponse.json({ key, value: setting?.value ?? null })
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
