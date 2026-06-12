import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireStaffContextApi, cityFilter, isInScope } from '@/lib/admin'
import prisma from '@/lib/db'
import { communityCreateSchema } from '@/lib/validations/community'
import { ensureEnglishSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffContextApi()
    if (staff instanceof NextResponse) return staff

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const status = searchParams.get('status')

    const baseFilter = cityFilter(staff)
    const where: any = { ...baseFilter }
    if (status) where.status = status
    if (city) {
      if (baseFilter.city) {
        // intersect requested city with allowed list
        const allowed = baseFilter.city.in
        where.city = allowed.includes(city) ? city : '__NONE__'
      } else {
        where.city = city
      }
    }
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
        include: { _count: { select: { claims: true } } },
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
    const staff = await requireStaffContextApi()
    if (staff instanceof NextResponse) return staff

    const body = await request.json()
    const validation = communityCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    if (staff.role === 'CITY_MANAGER') {
      if (!isInScope(staff, data.city)) {
        return NextResponse.json({ error: '只能在管辖城市内创建社区' }, { status: 403 })
      }
      data.status = 'PUBLISHED' as typeof data.status
    }

    // 确保 slug 为英文（含中文时自动转拼音）
    data.slug = ensureEnglishSlug(data.slug)

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
        coverImage: data.coverImage || null,
        images: data.images || undefined,
        featured: data.featured,
        realTips: data.realTips,
        entryFriendly: data.entryFriendly,
        processTime: data.processTime || null,
        lastVerifiedAt: data.lastVerifiedAt ? new Date(data.lastVerifiedAt) : null,
        transit: data.transit || null,
        totalArea: data.totalArea || null,
        totalWorkstations: data.totalWorkstations,
        focusTracks: data.focusTracks,
        amenities: data.amenities || [],
        contactNote: data.contactNote || null,
        benefits: data.benefits || undefined,
        entryInfo: data.entryInfo || undefined,
      },
    })

    revalidatePath('/communities')

    // 百度主动推送：新社区入库后异步通知百度，不阻塞主流程
    const baiduToken = process.env.BAIDU_PUSH_TOKEN
    if (baiduToken) {
      const communityUrl = `https://www.opcquan.com/communities/${community.slug}`
      fetch(
        `http://data.zz.baidu.com/urls?site=https://www.opcquan.com&token=${baiduToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: communityUrl,
        }
      ).catch(() => {
        // 推送失败不影响入库，静默处理
      })
    }

    return NextResponse.json(community)
  } catch (error) {
    console.error('创建社区失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
