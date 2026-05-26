import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

const patchSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  verified: z.boolean().optional(),
  level: z.number().int().min(1).max(5).optional(),
  bio: z.string().max(200).optional().nullable(),
  mainTrack: z.string().max(100).optional().nullable(),
  startupStage: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  name: z.string().max(50).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
}).strict()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        mainTrack: true,
        startupStage: true,
        role: true,
        level: true,
        verified: true,
        verifyType: true,
        showInPlaza: true,
        createdAt: true,
        inquiries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            communityName: true,
            status: true,
            createdAt: true,
            community: { select: { name: true } },
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            inquiries: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      inquiries: user.inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (parsed.data.role && staff.role !== 'ADMIN') {
      return NextResponse.json({ error: '仅管理员可修改角色' }, { status: 403 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        mainTrack: true,
        startupStage: true,
        role: true,
        level: true,
        verified: true,
        verifyType: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
