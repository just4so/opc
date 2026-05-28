import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { ProjectDetailClient } from '@/components/projects/project-detail-client'

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
      posts: {
        where: { type: 'PROGRESS', status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          milestone: true,
          createdAt: true,
          likeCount: true,
          commentCount: true,
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
  const project = await getProject(params.slug)
  if (!project) {
    return { title: '产品未找到 - OPC圈' }
  }
  return {
    title: `${project.name} - ${project.tagline} - OPC圈`,
    description: project.description?.slice(0, 160) || project.tagline,
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const project = await getProject(params.slug)
  if (!project || project.status !== 'PUBLISHED') {
    notFound()
  }

  const session = await auth()
  const currentUserId = session?.user?.id || null

  let isFavorited = false
  let isFollowingOwner = false

  if (currentUserId) {
    const [fav, follow] = await Promise.all([
      prisma.favorite.findUnique({
        where: { userId_projectId: { userId: currentUserId, projectId: project.id } },
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
    isFavorited = !!fav
    isFollowingOwner = !!follow
  }

  const serializedProject = {
    id: project.id,
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    logo: project.logo,
    screenshots: project.screenshots,
    techStack: project.techStack,
    stage: project.stage,
    mrr: project.mrr,
    isRevenuePublic: project.isRevenuePublic,
    website: project.website,
    commentCount: project._count.comments,
    owner: project.owner,
    posts: project.posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  }

  return (
    <ProjectDetailClient
      project={serializedProject}
      currentUserId={currentUserId}
      initialIsFavorited={isFavorited}
      initialIsFollowingOwner={isFollowingOwner}
    />
  )
}
