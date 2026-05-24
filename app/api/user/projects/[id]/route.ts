import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

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
