import { Suspense } from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { PenSquare } from 'lucide-react'
import { PostCard } from '@/components/plaza/post-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { TOPICS, POST_TYPES } from '@/constants/topics'

export const metadata: Metadata = {
  title: '创业广场 - OPC创业圈',
  description: '创业者日常交流、经验分享、问题求助、资源推荐的开放社区',
}

interface PageProps {
  searchParams: { type?: string; topic?: string; page?: string }
}

async function getPosts(type?: string, topic?: string, page: number = 1) {
  const limit = 20
  const where: any = {
    status: 'PUBLISHED',
  }

  if (type) {
    where.type = type
  }

  if (topic) {
    where.topics = { has: topic }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            level: true,
            verified: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ])

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export default async function PlazaPage({ searchParams }: PageProps) {
  const type = searchParams.type
  const topic = searchParams.topic
  const page = parseInt(searchParams.page || '1')
  const { posts, pagination } = await getPosts(type, topic, page)

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">创业广场</h1>
              <p className="text-gray-600">
                分享你的创业故事，与志同道合的创业者交流互动
              </p>
            </div>
            <Link href="/plaza/new">
              <Button>
                <PenSquare className="h-4 w-4 mr-2" />
                发布动态
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧筛选 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* 内容类型 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">内容类型</h3>
                <div className="space-y-2">
                  <Link
                    href="/plaza"
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      !type ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    全部
                  </Link>
                  {POST_TYPES.map((postType) => (
                    <Link
                      key={postType.id}
                      href={`/plaza?type=${postType.id}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        type === postType.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {postType.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 热门话题 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-secondary mb-4">热门话题</h3>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <Link
                      key={t.id}
                      href={`/plaza?topic=${t.id}`}
                    >
                      <Badge
                        variant={topic === t.id ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={topic === t.id ? {} : { borderColor: t.color, color: t.color }}
                      >
                        #{t.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* 右侧动态列表 */}
          <main className="lg:col-span-3 space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-lg">
                <p className="text-gray-500 mb-4">暂无动态</p>
                <Link href="/plaza/new">
                  <Button>发布第一条动态</Button>
                </Link>
              </div>
            )}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/plaza?${type ? `type=${type}&` : ''}${topic ? `topic=${topic}&` : ''}page=${p}`}
                    className={`px-4 py-2 rounded-md text-sm ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
