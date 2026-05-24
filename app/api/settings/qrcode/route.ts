import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key') || 'community_qrcode_url'
    const allowedKeys = ['community_qrcode_url', 'connect_qrcode_url']
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: '无效的 key' }, { status: 400 })
    }
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    })

    return NextResponse.json({ url: setting?.value || null })
  } catch (error) {
    console.error('获取二维码设置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
