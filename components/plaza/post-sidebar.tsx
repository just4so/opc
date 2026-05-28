import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { RecommendedCreatorCard } from './recommended-creator-card'
import { RecommendedPostCard } from './recommended-post-card'

interface PostSidebarProps {
  postId: string
  authorId: string
  topics: string[]
}

export async function PostSidebar({ postId, authorId, topics }: PostSidebarProps) {
  const session = await auth()
  const currentUserId = (session?.user as { id?: string })?.id

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { mainTrack: true },
  })

  const [authorPosts, relatedPosts, sameTrackUsers] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId,
        id: { not: postId },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),

    topics.length > 0
      ? prisma.post.findMany({
          where: {
            id: { not: postId },
            status: 'PUBLISHED',
            topics: { hasSome: topics },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { name: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        })
      : Promise.resolve([]),

    author?.mainTrack
      ? (async () => {
          let excludeIds = [authorId]
          if (currentUserId) {
            const following = await prisma.follow.findMany({
              where: { followerId: currentUserId },
              select: { followingId: true },
            })
            excludeIds = [authorId, ...following.map((f) => f.followingId)]
          }
          return prisma.user.findMany({
            where: {
              id: { notIn: excludeIds },
              mainTrack: author.mainTrack,
              showInPlaza: true,
            },
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
            orderBy: { lastActiveAt: 'desc' },
            take: 5,
          })
        })()
      : Promise.resolve([]),
  ])

  const hasAuthorPosts = authorPosts.length > 0
  const hasSameTrack = sameTrackUsers.length > 0
  const hasRelated = relatedPosts.length > 0

  if (!hasAuthorPosts && !hasSameTrack && !hasRelated) {
    return null
  }

  return (
    <div className="space-y-6">
      {hasAuthorPosts && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-semibold text-ink mb-3">TA 的其他动态</h3>
            <div className="divide-y divide-hairline-soft">
              {authorPosts.map((post) => (
                <RecommendedPostCard
                  key={post.id}
                  post={{
                    ...post,
                    createdAt: post.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasSameTrack && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-semibold text-ink mb-3">同方向创业者</h3>
            <div className="divide-y divide-hairline-soft">
              {sameTrackUsers.map((user) => (
                <RecommendedCreatorCard
                  key={user.id}
                  user={user}
                  isFollowing={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasRelated && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-semibold text-ink mb-3">相关帖子</h3>
            <div className="divide-y divide-hairline-soft">
              {relatedPosts.map((post) => (
                <RecommendedPostCard
                  key={post.id}
                  post={{
                    ...post,
                    createdAt: post.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
