import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: '无权限编辑' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, stage, website, contentType, images } = body

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ error: '名称和描述必填' }, { status: 400 })
    }

    if (description.length > 500) {
      return NextResponse.json({ error: '描述不能超过500字' }, { status: 400 })
    }

    const validContentTypes = ['PROJECT', 'DEMAND', 'COOPERATION'] as const
    const validStages = ['IDEA', 'BUILDING', 'LAUNCHED', 'REVENUE', 'PROFITABLE'] as const

    const ct = (contentType && validContentTypes.includes(contentType)) ? contentType : undefined
    const st = (stage && validStages.includes(stage)) ? stage : undefined

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description.trim(),
        ...(st && { stage: st }),
        ...(ct && { contentType: ct }),
        website: website?.trim() || null,
        ...(Array.isArray(images) && { images }),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        stage: true,
        website: true,
        contentType: true,
        images: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('更新项目失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: '无权限删除' }, { status: 403 })
    }

    await prisma.project.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除项目失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
