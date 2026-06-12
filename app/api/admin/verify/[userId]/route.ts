import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireStaff } from '@/lib/admin'

const VALID_VERIFY_TYPES = ['IDENTITY', 'ENTREPRENEUR', 'EXPERT', 'COMMUNITY'] as const

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const staff = await requireStaff()

  try {
    const { userId } = await params

    const body = await request.json()
    const { verified, verifyType } = body

    if (typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'verified must be a boolean' }, { status: 400 })
    }

    if (verified && verifyType) {
      if (!VALID_VERIFY_TYPES.includes(verifyType)) {
        return NextResponse.json({ error: 'Invalid verifyType' }, { status: 400 })
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, username: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verified,
        verifyType: verified ? (verifyType || null) : null,
      },
      select: { id: true, verified: true, verifyType: true },
    })

    prisma.auditLog.create({
      data: {
        userId: staff.id,
        userName: staff.name || staff.username,
        userRole: staff.role,
        action: verified ? 'APPROVE' : 'REJECT',
        targetType: 'USER',
        targetId: userId,
        targetName: user.name || user.username,
        changes: { verified: { from: !verified, to: verified }, ...(verifyType ? { verifyType: { from: null, to: verifyType } } : {}) },
      },
    }).catch(console.error)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('更新认证状态失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
