import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

interface ActivityItem {
  type: 'user' | 'inquiry' | 'post' | 'claim'
  title: string
  subtitle: string
  time: string
  link: string
}

export async function GET() {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const [users, inquiries, posts, claims] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, username: true, name: true, createdAt: true },
      }),
      prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          communityName: true,
          createdAt: true,
          community: { select: { name: true } },
        },
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: { select: { name: true, username: true } },
        },
      }),
      prisma.communityClaim.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          communityName: true,
          type: true,
          contactName: true,
          createdAt: true,
        },
      }),
    ])

    const items: ActivityItem[] = [
      ...users.map((u) => ({
        type: 'user' as const,
        title: `新用户注册`,
        subtitle: u.name || u.username,
        time: u.createdAt.toISOString(),
        link: `/admin/users/${u.id}`,
      })),
      ...inquiries.map((i) => ({
        type: 'inquiry' as const,
        title: `新入驻意向`,
        subtitle: `${i.name} → ${i.community?.name || i.communityName || '通用'}`,
        time: i.createdAt.toISOString(),
        link: `/admin/inquiries`,
      })),
      ...posts.map((p) => ({
        type: 'post' as const,
        title: `新帖子发布`,
        subtitle: p.title || p.content.slice(0, 40),
        time: p.createdAt.toISOString(),
        link: `/admin/posts`,
      })),
      ...claims.map((c) => ({
        type: 'claim' as const,
        title: c.type === 'CLAIM' ? '社区认领' : '社区收录申请',
        subtitle: `${c.contactName} — ${c.communityName}`,
        time: c.createdAt.toISOString(),
        link: `/admin/communities?tab=claims`,
      })),
    ]

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json(items.slice(0, 20))
  } catch (error) {
    console.error('获取活动流失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
