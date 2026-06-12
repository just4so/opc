export const revalidate = 60

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { createCardViewedNotification } from '@/lib/notifications'
import ProfileClient from '@/components/profile/profile-client'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params
  let username = rawUsername
  try { username = decodeURIComponent(rawUsername) } catch {}

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true, mainTrack: true },
  })

  if (!user) return { title: '用户不存在 | OPC圈' }

  const displayName = user.name || user.username
  const trackStr = user.mainTrack ? ` - ${user.mainTrack}` : ''

  return {
    title: `${displayName}${trackStr} | OPC圈`,
    description: `${displayName}的创业者主页${trackStr}`,
    openGraph: {
      title: `${displayName}${trackStr} | OPC圈`,
      description: `${displayName}的创业者主页${trackStr}`,
      url: `https://www.opcquan.com/profile/${user.username}`,
      siteName: 'OPC圈',
      locale: 'zh_CN',
      type: 'profile',
    },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params
  let username = rawUsername
  try { username = decodeURIComponent(rawUsername) } catch {}

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      level: true,
      verified: true,
      verifyType: true,
      mainTrack: true,
      startupStage: true,
      showInPlaza: true,
      createdAt: true,
      lastActiveAt: true,
      _count: {
        select: { posts: true },
      },
    },
  })

  if (!user) notFound()

  const [recentPosts, projects, progressItems] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
      },
    }),
    prisma.project.findMany({
      where: { ownerId: user.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        stage: true,
        website: true,
        contentType: true,
        likeCount: true,
        commentCount: true,
        images: true,
      },
    }),
    prisma.progress.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        milestone: true,
        createdAt: true,
        projectId: true,
        project: { select: { name: true, slug: true } },
      },
    }),
  ])

  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ])

  const session = await auth()
  let isFollowing = false
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    })
    isFollowing = !!follow
  }

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
  }

  if (session?.user?.id && session.user.id !== user.id && user.showInPlaza) {
    void createCardViewedNotification(user.id, session.user.name || '', session.user.id)
  }

  const serializedPosts = recentPosts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  const serializedProgress = progressItems.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <ProfileClient
      user={serializedUser}
      recentPosts={serializedPosts}
      projects={projects}
      progressItems={serializedProgress}
      followerCount={followerCount}
      followingCount={followingCount}
      isFollowing={isFollowing}
    />
  )
}
