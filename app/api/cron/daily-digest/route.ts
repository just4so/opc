import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendDailyDigestEmail } from '@/lib/notification-emails'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const likes = await prisma.like.findMany({
    where: {
      createdAt: { gte: yesterday, lt: today },
      post: { isNot: null },
    },
    select: {
      post: { select: { authorId: true } },
    },
  })

  const cardViews = await prisma.notification.findMany({
    where: {
      type: 'CARD_VIEWED',
      createdAt: { gte: yesterday, lt: today },
    },
    select: { userId: true },
  })

  const statsMap = new Map<string, { likeCount: number; viewCount: number }>()

  for (const like of likes) {
    if (!like.post) continue
    const uid = like.post.authorId
    const entry = statsMap.get(uid) || { likeCount: 0, viewCount: 0 }
    entry.likeCount++
    statsMap.set(uid, entry)
  }

  for (const view of cardViews) {
    const uid = view.userId
    const entry = statsMap.get(uid) || { likeCount: 0, viewCount: 0 }
    entry.viewCount++
    statsMap.set(uid, entry)
  }

  let sent = 0
  const entries = Array.from(statsMap.entries())
  for (const [userId, stats] of entries) {
    if (stats.likeCount === 0 && stats.viewCount === 0) continue
    sendDailyDigestEmail(userId, stats).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent, usersWithActivity: statsMap.size })
}
