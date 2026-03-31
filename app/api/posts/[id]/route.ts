import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: postId } = await params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  const role = (session.user as any).role
  if (post.authorId !== session.user.id && role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: 'DELETED' },
  })

  revalidatePath('/plaza')
  revalidatePath(`/plaza/${postId}`)

  return NextResponse.json({ success: true })
}
