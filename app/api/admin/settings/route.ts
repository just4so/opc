import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()

  try {
    const settings = await prisma.siteSetting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()

  try {
    const { key, value } = await req.json()
    if (!key || typeof value !== 'string') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('更新系统设置失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
