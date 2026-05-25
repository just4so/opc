import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const PRODUCT_STAGE_MAP: Record<string, string> = {
  '想法阶段': 'IDEA',
  '开发中': 'BUILDING',
  '已上线': 'LAUNCHED',
  '有收入': 'REVENUE',
  '已盈利': 'PROFITABLE',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const createInquirySchema = z.object({
  communitySlug: z.string().optional(),
  name: z.string().min(1, '请填写称呼').max(50),
  contact: z.string().min(1, '请填写联系方式').max(100),
  city: z.string().max(50).optional(),
  bio: z.string().min(1, '请填写你在做什么').max(200),
  productName: z.string().max(100).optional(),
  productTagline: z.string().max(300).optional(),
  productStage: z.string().max(50).optional(),
  productWebsite: z.string().max(200).optional(),
  showInPlaza: z.boolean().optional().default(true),
  bpUrl: z.string().max(500).optional(),
  bpFilename: z.string().max(200).optional(),
  source: z.string().max(500).optional(),
  acceptInterview: z.boolean().optional().default(false),
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

    const {
      communitySlug, name, contact, city,
      bio, productName, productTagline, productStage, productWebsite,
      showInPlaza, bpUrl, bpFilename, source, acceptInterview,
    } = parsed.data

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
            communityContact,
            unlocked: true,
          },
          { status: 409 }
        )
      }
    }

    const userId = session.user.id

    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.create({
        data: {
          userId,
          communityId,
          communityName,
          name,
          contact,
          city,
          bpUrl,
          bpFilename,
          source,
          acceptInterview: acceptInterview ?? false,
        },
      })

      const userUpdate: Record<string, unknown> = {}
      if (bio) userUpdate.bio = bio
      if (city) userUpdate.location = city
      if (name && !session.user?.name) userUpdate.name = name
      userUpdate.wechat = contact
      userUpdate.showInPlaza = showInPlaza

      await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      })

      let projectId: string | null = null
      if (productName) {
        const baseSlug = slugify(productName) || 'project'
        const suffix = Date.now().toString(36)
        const projectSlug = `${baseSlug}-${suffix}`
        const stageEnum = (productStage && PRODUCT_STAGE_MAP[productStage]) || 'IDEA'

        const project = await tx.project.create({
          data: {
            slug: projectSlug,
            name: productName,
            tagline: productTagline || '',
            description: productTagline || '',
            stage: stageEnum as 'IDEA' | 'BUILDING' | 'LAUNCHED' | 'REVENUE' | 'PROFITABLE',
            website: productWebsite || null,
            ownerId: userId,
            status: 'PUBLISHED',
            contentType: 'PROJECT',
          },
        })
        projectId = project.id
      }

      return { inquiryId: inquiry.id, projectId }
    })

    return NextResponse.json({
      id: result.inquiryId,
      projectId: result.projectId,
      communityContact,
      unlocked: true,
    })
  } catch (error) {
    console.error('Create inquiry error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

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
