import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Heart,
  MessageCircle,
  Calendar,
  Users,
  DollarSign,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { PROJECT_STAGES } from '@/constants/topics'

interface PageProps {
  params: { slug: string }
}

async function getProject(slug: string) {
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      owner: {
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
        take: 10,
      },
    },
  })

  return project
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProject(params.slug)

  if (!project) {
    return { title: '项目未找到 - OPC创业圈' }
  }

  return {
    title: `${project.name} - ${project.tagline} - OPC创业圈`,
    description: project.description.substring(0, 160),
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const project = await getProject(params.slug)

  if (!project) {
    notFound()
  }

  const stage = PROJECT_STAGES.find((s) => s.id === project.stage)

  return (
    <div className="min-h-screen bg-background">
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/projects"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回项目展示
          </Link>
        </div>
      </div>

      {/* 项目头部 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl font-bold text-primary flex-shrink-0 overflow-hidden">
              {project.logo ? (
                <img
                  src={project.logo}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                project.name[0]
              )}
            </div>

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-secondary">
                  {project.name}
                </h1>
                {project.featured && (
                  <Badge variant="default">推荐</Badge>
                )}
                {stage && (
                  <Badge
                    variant="outline"
                    style={{ borderColor: stage.color, color: stage.color }}
                  >
                    {stage.name}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-gray-600 mb-4">{project.tagline}</p>

              {/* 链接按钮 */}
              <div className="flex flex-wrap gap-3">
                {project.website && (
                  <Button asChild>
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      访问官网 <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
                {project.github && (
                  <Button variant="outline" asChild>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4 mr-2" /> GitHub
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* 互动数据 */}
            <div className="flex md:flex-col gap-4 text-gray-500">
              <div className="flex items-center space-x-1">
                <Heart className="h-5 w-5" />
                <span>{project.likeCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-5 w-5" />
                <span>{project.commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 项目描述 */}
            <Card>
              <CardHeader>
                <CardTitle>项目介绍</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* 技术栈 */}
            {project.techStack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>技术栈</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 评论区 */}
            <Card>
              <CardHeader>
                <CardTitle>评论 ({project.comments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {project.comments.length > 0 ? (
                  <div className="space-y-4">
                    {project.comments.map((comment) => (
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

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 项目数据 */}
            <Card>
              <CardHeader>
                <CardTitle>项目数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    发布于{' '}
                    {formatDistanceToNow(new Date(project.createdAt), {
                      locale: zhCN,
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {project.isRevenuePublic && project.mrr && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                    <span className="font-medium text-green-600">
                      ${project.mrr}/月
                    </span>
                  </div>
                )}
                {project.userCount && (
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{project.userCount} 用户</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 分类标签 */}
            {project.category.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>分类</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.category.map((cat) => (
                      <Badge key={cat} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 创始人 */}
            <Card>
              <CardHeader>
                <CardTitle>创始人</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold">
                    {project.owner.name?.[0] || project.owner.username[0]}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${project.owner.username}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {project.owner.name || project.owner.username}
                    </Link>
                    {project.owner.verified && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        认证
                      </Badge>
                    )}
                    <div className="text-sm text-gray-500">
                      Lv.{project.owner.level}
                    </div>
                  </div>
                </div>
                {project.owner.bio && (
                  <p className="text-sm text-gray-600">{project.owner.bio}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
