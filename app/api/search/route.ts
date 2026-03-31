import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LIMIT = 10

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')

    if (!q) {
      return NextResponse.json({
        posts: [],
        orders: [],
        communities: [],
        users: [],
        total: { posts: 0, orders: 0, communities: 0, users: 0 },
      })
    }

    if (q.length > 100) {
      return NextResponse.json({ error: '搜索词过长' }, { status: 400 })
    }

    const skip = (page - 1) * LIMIT

    // 并行搜索所有类型
    const [posts, orders, communities, users, counts] = await Promise.all([
      // 搜索动态
      type === 'all' || type === 'post'
        ? prisma.post.findMany({
            where: {
              status: 'PUBLISHED',
              content: { contains: q, mode: 'insensitive' },
            },
            take: LIMIT,
            skip: type === 'post' ? skip : 0,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          })
        : [],

      // 搜索订单
      type === 'all' || type === 'order'
        ? prisma.project.findMany({
            where: {
              status: 'PUBLISHED',
              contentType: { in: ['DEMAND', 'COOPERATION'] },
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { tagline: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: LIMIT,
            skip: type === 'order' ? skip : 0,
            orderBy: { createdAt: 'desc' },
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          })
        : [],

      // 搜索社区
      type === 'all' || type === 'community'
        ? prisma.community.findMany({
            where: {
              status: 'ACTIVE',
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: LIMIT,
            skip: type === 'community' ? skip : 0,
            orderBy: { createdAt: 'desc' },
          })
        : [],

      // 搜索用户
      type === 'all' || type === 'user'
        ? prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: LIMIT,
            skip: type === 'user' ? skip : 0,
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              level: true,
              verified: true,
              skills: true,
            },
          })
        : [],

      // 获取各类型总数
      Promise.all([
        prisma.post.count({
          where: {
            status: 'PUBLISHED',
            content: { contains: q, mode: 'insensitive' },
          },
        }),
        prisma.project.count({
          where: {
            status: 'PUBLISHED',
            contentType: { in: ['DEMAND', 'COOPERATION'] },
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { tagline: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
        prisma.community.count({
          where: {
            status: 'ACTIVE',
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
        prisma.user.count({
          where: {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]),
    ])

    return NextResponse.json({
      posts,
      orders,
      communities,
      users,
      total: {
        posts: counts[0],
        orders: counts[1],
        communities: counts[2],
        users: counts[3],
      },
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json({ error: '搜索失败' }, { status: 500 })
  }
}
