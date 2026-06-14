import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { ProjectDetailClient } from '@/components/projects/project-detail-client'
import { createProjectViewedNotification } from '@/lib/notifications'

export const revalidate = 300
export const dynamicParams = true

interface PageProps {
  params: { slug: string }
}

const getProject = cache(async (slug: string) => {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          verified: true,
          mainTrack: true,
        },
      },
      progress: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          content: true,
          milestone: true,
          createdAt: true,
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  })
})

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  })
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProject(decodeURIComponent(params.slug))
  if (!project) {
    return { title: '产品未找到 - OPC圈' }
  }
  return {
    title: `${project.name} - OPC圈`,
    description: project.description?.slice(0, 160) || project.name,
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const project = await getProject(decodeURIComponent(params.slug))
  if (!project || project.status !== 'PUBLISHED') {
    notFound()
  }

  const session = await auth()
  const currentUserId = session?.user?.id || null

  let isLiked = false
  let isFollowingOwner = false

  if (currentUserId) {
    const [like, follow] = await Promise.all([
      prisma.favorite.findFirst({
        where: { userId: currentUserId, projectId: project.id },
      }),
      currentUserId !== project.owner.id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: project.owner.id,
              },
            },
          })
        : null,
    ])
    isLiked = !!like
    isFollowingOwner = !!follow
  }

  const serializedProject = {
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    logo: project.logo,
    images: project.images,
    techStack: project.techStack,
    stage: project.stage,
    mrr: project.mrr,
    isRevenuePublic: project.isRevenuePublic,
    website: project.website,
    likeCount: project.likeCount,
    commentCount: project._count.comments,
    owner: project.owner,
    progressList: project.progress.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  }

  // Fire-and-forget: notify project owner when a non-owner logged-in user views
  if (currentUserId && currentUserId !== project.owner.id) {
    const slug = decodeURIComponent(params.slug)
    createProjectViewedNotification(
      project.owner.id,
      session?.user?.name || '',
      currentUserId,
      slug,
      project.name
    ).catch(console.error)
  }

  return (
    <ProjectDetailClient
      project={serializedProject}
      currentUserId={currentUserId}
      initialIsLiked={isLiked}
      initialIsFollowingOwner={isFollowingOwner}
    />
  )
}
