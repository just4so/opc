import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import prisma from '@/lib/db'
import { TOPICS, POST_TYPES } from '@/constants/topics'

interface PageProps {
  params: { id: string }
}

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          level: true,
          verified: true,
        },
      },
      comments: {
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
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  return post
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.id)

  if (!post) {
    return { title: '动态未找到 - OPC创业圈' }
  }

  return {
    title: `${post.author.name || post.author.username}的动态 - OPC创业圈`,
    description: post.content.substring(0, 160),
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  const postType = POST_TYPES.find((t) => t.id === post.type)

  return (
    <div className="min-h-screen bg-background">
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/plaza"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回创业广场
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {/* 作者信息 */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold text-lg">
                      {post.author.name?.[0] || post.author.username[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/profile/${post.author.username}`}
                          className="font-semibold text-secondary hover:text-primary transition-colors"
                        >
                          {post.author.name || post.author.username}
                        </Link>
                        {post.author.verified && (
                          <Badge variant="secondary" className="text-xs">
                            认证
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          locale: zhCN,
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                  {postType && <Badge variant="outline">{postType.name}</Badge>}
                </div>

                {/* 内容 */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* 图片 */}
                {post.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {post.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 话题标签 */}
                {post.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.topics.map((topicId) => {
                      const topic = TOPICS.find((t) => t.id === topicId)
                      return topic ? (
                        <Badge
                          key={topicId}
                          variant="outline"
                          style={{ borderColor: topic.color, color: topic.color }}
                        >
                          #{topic.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                {/* 互动栏 */}
                <div className="flex items-center space-x-6 pt-4 border-t text-gray-500">
                  <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
                    <Heart className="h-5 w-5" />
                    <span>{post.likeCount} 赞</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.commentCount} 评论</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                    <Share2 className="h-5 w-5" />
                    <span>分享</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* 评论区 */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">
                  评论 ({post.comments.length})
                </h3>

                {post.comments.length > 0 ? (
                  <div className="space-y-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {comment.author.name?.[0] || comment.author.username[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {comment.author.name || comment.author.username}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                locale: zhCN,
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mt-1">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    暂无评论，来说两句吧
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 - 作者信息 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">关于作者</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-xl">
                    {post.author.name?.[0] || post.author.username[0]}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {post.author.name || post.author.username}
                    </Link>
                    <div className="text-sm text-gray-500">
                      Lv.{post.author.level}
                    </div>
                  </div>
                </div>
                {post.author.bio && (
                  <p className="text-sm text-gray-600">{post.author.bio}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
