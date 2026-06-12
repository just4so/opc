import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'
import { createInquiryStatusNotification } from '@/lib/notifications'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  introduction: z.string().max(500).optional(),
  stage: z.string().max(100).optional(),
  bpUrl: z.string().optional().nullable(),
  bpFilename: z.string().optional().nullable(),
  adminNote: z.string().max(1000).optional().nullable(),
  status: z.enum(['PENDING', 'CONTACTED', 'DONE', 'CANCELLED']).optional(),
}).strict()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bio: true,
            mainTrack: true,
            startupStage: true,
            location: true,
            avatar: true,
            verified: true,
            verifyType: true,
          },
        },
        community: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!inquiry) {
      return NextResponse.json({ error: '意向不存在' }, { status: 404 })
    }

    return NextResponse.json({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('获取意向详情失败:', error)
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

    const existing = await prisma.inquiry.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: '意向不存在' }, { status: 404 })
    }

    const inquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bio: true,
            mainTrack: true,
            startupStage: true,
            location: true,
            avatar: true,
            verified: true,
            verifyType: true,
          },
        },
        community: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (parsed.data.status && parsed.data.status !== existing.status) {
      void createInquiryStatusNotification(inquiry.userId, inquiry.id, parsed.data.status)
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {}
    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) changes.status = { from: existing.status, to: parsed.data.status }
    if (parsed.data.adminNote !== undefined && parsed.data.adminNote !== existing.adminNote) changes.adminNote = { from: existing.adminNote, to: parsed.data.adminNote }

    prisma.auditLog.create({
      data: {
        userId: staff.id,
        userName: staff.name || staff.username,
        userRole: staff.role,
        action: changes.status ? 'STATUS_CHANGE' : 'UPDATE',
        targetType: 'INQUIRY',
        targetId: inquiry.id,
        targetName: existing.name,
        changes: Object.keys(changes).length > 0 ? JSON.parse(JSON.stringify(changes)) : null,
      },
    }).catch(console.error)

    return NextResponse.json({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('更新意向失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
