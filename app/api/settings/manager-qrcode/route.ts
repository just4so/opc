import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const manager = await prisma.cityManager.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, city: true, province: true, wechat: true },
  })

  return NextResponse.json({ manager })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  if ((session.user as any).role !== 'CITY_MANAGER') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const body = await request.json()
  const { qrcodeUrl } = body as { qrcodeUrl: string }

  if (!qrcodeUrl || typeof qrcodeUrl !== 'string') {
    return NextResponse.json({ error: '无效的二维码 URL' }, { status: 400 })
  }

  const manager = await prisma.cityManager.findUnique({
    where: { userId: session.user.id },
  })

  if (!manager) {
    return NextResponse.json({ error: '未找到主理人记录' }, { status: 404 })
  }

  const updated = await prisma.cityManager.update({
    where: { id: manager.id },
    data: { wechat: qrcodeUrl },
  })

  revalidatePath('/local')
  revalidatePath('/about')

  return NextResponse.json({ manager: updated })
}
