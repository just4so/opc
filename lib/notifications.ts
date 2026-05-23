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

  return createNotification({
    userId: ownerId,
    type: 'CARD_VIEWED',
    title: `${visitorName || '有人'}查看了你的创业者卡片`,
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
