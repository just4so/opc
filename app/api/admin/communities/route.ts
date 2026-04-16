import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { communityCreateSchema } from '@/lib/validations/community'

export const dynamic = 'force-dynamic'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status
    if (city) where.city = city
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { operator: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip: (page - 1) * LIMIT,
        take: LIMIT,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.community.count({ where }),
    ])

    return NextResponse.json({
      communities,
      pagination: {
        page,
        limit: LIMIT,
        total,
        totalPages: Math.ceil(total / LIMIT),
      },
    })
  } catch (error) {
    console.error('获取社区列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const validation = communityCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if slug already exists
    const existingSlug = await prisma.community.findUnique({
      where: { slug: data.slug },
    })
    if (existingSlug) {
      return NextResponse.json({ error: 'slug 已存在' }, { status: 400 })
    }

    const community = await prisma.community.create({
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city,
        district: data.district || null,
        address: data.address,
        description: data.description,
        type: data.type,
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        operator: data.operator || null,
        contactName: data.contactName || null,
        contactWechat: data.contactWechat || null,
        contactPhone: data.contactPhone || null,
        website: data.website || null,
        suitableFor: data.suitableFor,
        coverImage: data.coverImage || null,
        images: data.images || undefined,
        featured: data.featured,
        realTips: data.realTips,
        applyDifficulty: data.applyDifficulty,
        processTime: data.processTime || null,
        lastVerifiedAt: data.lastVerifiedAt ? new Date(data.lastVerifiedAt) : null,
        transit: data.transit || null,
        totalArea: data.totalArea || null,
        totalWorkstations: data.totalWorkstations,
        focusTracks: data.focusTracks,
        contactNote: data.contactNote || null,
        benefits: data.benefits || undefined,
        entryInfo: data.entryInfo || undefined,
      },
    })

    revalidatePath('/communities')

    return NextResponse.json(community)
  } catch (error) {
    console.error('创建社区失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
