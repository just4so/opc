export const revalidate = 60

import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import ProfileClient from '@/components/profile/profile-client'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params

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
      skills: true,
      canOffer: true,
      lookingFor: true,
      createdAt: true,
      _count: {
        select: { posts: true },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const recentPosts = await prisma.post.findMany({
    where: { authorId: user.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
    },
  })

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  }

  const serializedPosts = recentPosts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return <ProfileClient user={serializedUser} recentPosts={serializedPosts} />
}
