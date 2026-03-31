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

  const { id: commentId } = await params

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  const role = (session.user as any).role
  if (comment.authorId !== session.user.id && role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  const postId = comment.postId

  await prisma.$transaction(async (tx) => {
    // Count direct replies to this comment
    const replyCount = await tx.comment.count({ where: { parentId: commentId } })
    // Delete comment (cascades to replies)
    await tx.comment.delete({ where: { id: commentId } })
    // Decrement post commentCount by 1 + replies
    if (postId) {
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 + replyCount } },
      })
    }
  })

  if (postId) {
    revalidatePath(`/plaza/${postId}`)
  }

  return NextResponse.json({ success: true })
}
