import prisma from '@/lib/db'

export async function createNotification({
  userId,
  type,
  title,
  content,
  relatedId,
}: {
  userId: string
  type: string
  title: string
  content?: string
  relatedId?: string
}) {
  return prisma.notification.create({
    data: { userId, type, title, content, relatedId },
  })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待处理',
  CONTACTED: '已联系',
  DONE: '已完成',
  CANCELLED: '已取消',
}

export async function createCardViewedNotification(
  ownerId: string,
  visitorName: string,
  visitorId: string
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: ownerId,
      type: 'CARD_VIEWED',
      relatedId: visitorId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  // 服务端查询访客 username，不依赖调用方传入（避免旧 session 拿不到 username 的问题）
  const visitor = await prisma.user.findUnique({
    where: { id: visitorId },
    select: { username: true },
  })

  return createNotification({
    userId: ownerId,
    type: 'CARD_VIEWED',
    title: `${visitorName || '有人'}查看了你的创业者卡片`,
    content: visitor?.username ?? undefined,
    relatedId: visitorId,
  })
}

export async function createCardContactedNotification(
  ownerId: string,
  contactName: string
) {
  return createNotification({
    userId: ownerId,
    type: 'CARD_CONTACTED',
    title: `${contactName || '有人'}向你发起了联系`,
  })
}

export async function createInquiryStatusNotification(
  userId: string,
  inquiryId: string,
  newStatus: string
) {
  const label = STATUS_LABEL[newStatus] || newStatus
  return createNotification({
    userId,
    type: 'INQUIRY_STATUS',
    title: `你的入驻意向状态已更新为「${label}」`,
    relatedId: inquiryId,
  })
}

export async function createFollowNotification(
  targetUserId: string,
  followerName: string,
  followerId: string,
  followerUsername: string
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: targetUserId,
      type: 'NEW_FOLLOWER',
      relatedId: followerId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  return createNotification({
    userId: targetUserId,
    type: 'NEW_FOLLOWER',
    title: `${followerName} 关注了你`,
    content: followerUsername,
    relatedId: followerId,
  })
}

export async function createPostLikedNotification(
  postAuthorId: string,
  likerName: string,
  postId: string,
  likerId: string
) {
  if (postAuthorId === likerId) return null

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: postAuthorId,
      type: 'POST_LIKED',
      relatedId: postId,
      content: likerId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  return createNotification({
    userId: postAuthorId,
    type: 'POST_LIKED',
    title: `${likerName} 赞了你的动态`,
    content: likerId,
    relatedId: postId,
  })
}

export async function createPostCommentedNotification(
  postAuthorId: string,
  commenterName: string,
  postId: string,
  commenterId: string
) {
  if (postAuthorId === commenterId) return null

  return createNotification({
    userId: postAuthorId,
    type: 'POST_COMMENTED',
    title: `${commenterName} 评论了你的动态`,
    content: commenterId,
    relatedId: postId,
  })
}

export async function createCommentRepliedNotification(
  commentAuthorId: string,
  replierName: string,
  postId: string,
  replierId: string
) {
  if (commentAuthorId === replierId) return null

  return createNotification({
    userId: commentAuthorId,
    type: 'COMMENT_REPLIED',
    title: `${replierName} 回复了你的评论`,
    content: replierId,
    relatedId: postId,
  })
}

export async function createProjectViewedNotification(
  ownerId: string,
  visitorName: string,
  visitorId: string,
  projectSlug: string,
  projectName: string
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: ownerId,
      type: 'PROJECT_VIEWED',
      relatedId: projectSlug,
      content: visitorId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  return createNotification({
    userId: ownerId,
    type: 'PROJECT_VIEWED',
    title: `${visitorName || '有人'}查看了你的产品「${projectName}」`,
    content: visitorId,
    relatedId: projectSlug,
  })
}
