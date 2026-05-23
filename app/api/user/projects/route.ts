import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, tagline, stage, website, contentType } = body

    if (!name?.trim() || !tagline?.trim()) {
      return NextResponse.json({ error: '名称和简介必填' }, { status: 400 })
    }

    const validContentTypes = ['PROJECT', 'DEMAND', 'COOPERATION'] as const
    const validStages = ['IDEA', 'BUILDING', 'LAUNCHED', 'REVENUE', 'PROFITABLE'] as const

    const ct = (contentType && validContentTypes.includes(contentType)) ? contentType : 'PROJECT'
    const st = (stage && validStages.includes(stage)) ? stage : 'IDEA'

    const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')}-${Date.now()}`

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        tagline: tagline.trim(),
        description: tagline.trim(),
        stage: st,
        website: website?.trim() || null,
        contentType: ct,
        slug,
        ownerId: session.user.id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        tagline: true,
        stage: true,
        website: true,
        contentType: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
