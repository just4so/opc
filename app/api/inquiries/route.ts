import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const createInquirySchema = z.object({
  communitySlug: z.string().optional(),
  name: z.string().min(1, '请填写称呼').max(50),
  contact: z.string().min(1, '请填写联系方式').max(100),
  city: z.string().max(50).optional(),
  introduction: z.string().max(500).optional(),
  stage: z.string().max(50).optional(),
  wantCard: z.boolean().optional().default(false),
  wantVerify: z.boolean().optional().default(false),
  source: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createInquirySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '参数错误' },
        { status: 400 }
      )
    }

    const { communitySlug, name, contact, city, introduction, stage, wantCard, wantVerify, source } = parsed.data

    // Resolve community if slug provided
    let communityId: string | null = null
    let communityName: string | null = null
    let communityContact: { name?: string; phone?: string; wechat?: string } | null = null

    if (communitySlug) {
      const community = await prisma.community.findUnique({
        where: { slug: communitySlug },
        select: {
          id: true,
          name: true,
          contactName: true,
          contactPhone: true,
          contactWechat: true,
        },
      })
      if (!community) {
        return NextResponse.json({ error: '社区不存在' }, { status: 404 })
      }
      communityId = community.id
      communityName = community.name
      if (community.contactName || community.contactPhone || community.contactWechat) {
        communityContact = {
          name: community.contactName || undefined,
          phone: community.contactPhone || undefined,
          wechat: community.contactWechat || undefined,
        }
      }

      // Check duplicate: same user + same community + PENDING/CONTACTED
      const existing = await prisma.inquiry.findFirst({
        where: {
          userId: session.user.id,
          communityId: community.id,
          status: { in: ['PENDING', 'CONTACTED'] },
        },
        select: { id: true, status: true, createdAt: true },
      })
      if (existing) {
        return NextResponse.json(
          {
            error: '你已提交过该社区的对接意向',
            existing: {
              id: existing.id,
              status: existing.status,
              createdAt: existing.createdAt.toISOString(),
            },
            // Still return contact info since they already submitted
            communityContact,
            unlocked: true,
          },
          { status: 409 }
        )
      }
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        communityId,
        communityName,
        name,
        contact,
        city,
        introduction,
        stage,
        wantCard,
        wantVerify,
        source,
      },
    })

    // Sync user fields from inquiry data
    const userUpdate: Record<string, unknown> = {}
    if (name && !session.user.name) userUpdate.name = name
    if (city) userUpdate.location = city
    if (introduction) userUpdate.mainTrack = introduction
    if (stage) userUpdate.startupStage = stage
    // Detect if contact is phone or wechat
    if (contact) {
      if (/^1\d{10}$/.test(contact.replace(/[-\s]/g, ''))) {
        userUpdate.phone = contact.replace(/[-\s]/g, '')
      } else {
        userUpdate.wechat = contact
      }
    }

    // Set showInPlaza if wantCard
    if (wantCard) {
      userUpdate.showInPlaza = true
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate,
      })
    }

    return NextResponse.json({
      id: inquiry.id,
      communityContact,
      unlocked: true,
    })
  } catch (error) {
    console.error('Create inquiry error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// GET: Check if current user has unlocked contact info (has any inquiry)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unlocked: false })
    }

    const count = await prisma.inquiry.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ unlocked: count > 0 })
  } catch (error) {
    console.error('Check unlock error:', error)
    return NextResponse.json({ unlocked: false })
  }
}
