import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import prisma from '@/lib/db'
import { FollowListClient } from '@/components/follow/follow-list-client'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params
  let username = rawUsername
  try { username = decodeURIComponent(rawUsername) } catch {}

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true },
  })

  if (!user) return { title: '用户不存在 | OPC圈' }

  return {
    title: `${user.name || user.username}的关注 | OPC圈`,
  }
}

export default async function FollowingPage({ params }: PageProps) {
  const { username: rawUsername } = await params
  let username = rawUsername
  try { username = decodeURIComponent(rawUsername) } catch {}

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  })

  if (!user) notFound()

  return (
    <FollowListClient
      userId={user.id}
      username={user.username}
      type="following"
    />
  )
}
