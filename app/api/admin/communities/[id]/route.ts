import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { communityUpdateSchema } from '@/lib/validations/community'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const community = await prisma.community.findUnique({
      where: { id: params.id },
    })

    if (!community) {
      return NextResponse.json({ error: '社区不存在' }, { status: 404 })
    }

    return NextResponse.json(community)
  } catch (error) {
    console.error('获取社区详情失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const validation = communityUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if slug already exists (if updating slug)
    if (data.slug) {
      const existingSlug = await prisma.community.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: params.id },
        },
      })
      if (existingSlug) {
        return NextResponse.json({ error: 'slug 已存在' }, { status: 400 })
      }
    }

    const updateData: any = {}

    // Map all possible fields
    const fields = [
      'name',
      'slug',
      'city',
      'district',
      'address',
      'description',
      'type',
      'status',
      'latitude',
      'longitude',
      'operator',
      'contactName',
      'contactWechat',
      'contactPhone',
      'website',
      'spaceSize',
      'workstations',
      'focus',
      'services',
      'suitableFor',
      'entryProcess',
      'policies',
      'links',
      'coverImage',
      'images',
      'featured',
      'realTips',
      'applyDifficulty',
      'processTime',
      'lastVerifiedAt',
      'transit',
      'totalArea',
      'totalWorkstations',
      'focusTracks',
      'contactNote',
      'benefits',
      'entryInfo',
    ]

    for (const field of fields) {
      if (data[field as keyof typeof data] !== undefined) {
        updateData[field] = data[field as keyof typeof data]
      }
    }

    // Convert lastVerifiedAt string to Date
    if (updateData.lastVerifiedAt) {
      updateData.lastVerifiedAt = new Date(updateData.lastVerifiedAt)
    } else if (updateData.lastVerifiedAt === '') {
      updateData.lastVerifiedAt = null
    }

    const community = await prisma.community.update({
      where: { id: params.id },
      data: updateData,
    })

    revalidatePath('/communities')
    revalidatePath(`/communities/${community.newSlug ?? community.slug}`)

    return NextResponse.json(community)
  } catch (error) {
    console.error('更新社区失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.community.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除社区失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
