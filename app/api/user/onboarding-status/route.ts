import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// 轻量接口：返回当前用户的 onboarding 状态
// 未登录返回 { completed: true }（不展示 onboarding 弹窗）
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ completed: true })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, mainTracks: true, location: true },
  })

  if (!user || user.onboardingCompleted) {
    return NextResponse.json({ completed: true })
  }

  return NextResponse.json({
    completed: false,
    userId: session.user.id,
    mainTracks: user.mainTracks,
    location: user.location,
  })
}
