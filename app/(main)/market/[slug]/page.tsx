import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const revalidate = 120 // 合作详情 2 分钟 ISR
import {
  ArrowLeft,
  Briefcase,
  Handshake,
  Calendar,
  Eye,
  DollarSign,
  Tag,
  MessageCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactButton } from '@/components/market/contact-button'
import prisma from '@/lib/db'
import { CONTENT_TYPES, BUDGET_TYPES } from '@/constants/topics'

interface PageProps {
  params: { slug: string }
}

async function getOrder(slug: string) {
  // URL 解码处理中文 slug
  const decodedSlug = decodeURIComponent(slug)

  const order = await prisma.project.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { id: decodedSlug }],
      contentType: { in: ['DEMAND', 'COOPERATION'] },
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
          wechat: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  return order
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const order = await getOrder(params.slug)

  if (!order) {
    return { title: '订单未找到 - OPC创业圈' }
  }

  return {
    title: `${order.name} - ${order.tagline} - OPC创业圈`,
    description: order.description.substring(0, 160),
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await getOrder(params.slug)

  if (!order) {
    notFound()
  }

  const contentType = CONTENT_TYPES.find(t => t.id === order.contentType)
  const budgetType = BUDGET_TYPES.find(t => t.id === order.budgetType)

  const getBudgetDisplay = () => {
    if (!order.budgetType || order.budgetType === 'NEGOTIABLE') {
      return '面议'
    }
    if (order.budgetType === 'FIXED' && order.budgetMin) {
      return `¥${order.budgetMin.toLocaleString()}`
    }
    if (order.budgetType === 'RANGE' && order.budgetMin && order.budgetMax) {
      return `¥${order.budgetMin.toLocaleString()} - ¥${order.budgetMax.toLocaleString()}`
    }
    return '面议'
  }

  // 用 id 的字符 charCode 求和生成稳定虚拟浏览数（30-250之间）
  const getVirtualViewCount = (id: string) => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return (hash % 220) + 30
  }

  const displayViewCount = order.viewCount > 0 ? order.viewCount : getVirtualViewCount(order.id)

  // 增加浏览量
  await prisma.project.update({
    where: { id: order.id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/market"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回合作广场
          </Link>
        </div>
      </div>

      {/* 订单头部 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* 类型图标 */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: contentType?.color + '20' }}
            >
              {order.contentType === 'DEMAND' ? (
                <Briefcase className="h-8 w-8" style={{ color: contentType?.color }} />
              ) : (
                <Handshake className="h-8 w-8" style={{ color: contentType?.color }} />
              )}
            </div>

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  style={{ borderColor: contentType?.color, color: contentType?.color }}
                >
                  {contentType?.name}
                </Badge>
                {order.featured && (
                  <Badge variant="default">推荐</Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">
                {order.name}
              </h1>
              <p className="text-lg text-gray-600">{order.tagline}</p>
            </div>

            {/* 预算 */}
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">预算</div>
              <div className="text-2xl font-bold text-primary">
                {getBudgetDisplay()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 需求描述 */}
            <Card>
              <CardHeader>
                <CardTitle>需求描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {order.description}
                </p>
              </CardContent>
            </Card>

            {/* 所需技能 */}
            {order.skills && order.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>所需技能</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {order.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-primary-50 text-primary rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 联系方式提示 */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <span>有意合作？请联系发布者</span>
                  </div>
                  <ContactButton owner={order.owner} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 订单信息 */}
            <Card>
              <CardHeader>
                <CardTitle>订单信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    发布于{' '}
                    {formatDistanceToNow(new Date(order.createdAt), {
                      locale: zhCN,
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {order.deadline && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-orange-500" />
                    <span>
                      截止日期: {format(new Date(order.deadline), 'yyyy年MM月dd日')}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                  <span>
                    预算类型: {budgetType?.name || '面议'}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Eye className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{displayViewCount + 1} 次浏览</span>
                </div>
              </CardContent>
            </Card>

            {/* 分类标签 */}
            {order.category.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>服务分类</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {order.category.map((cat) => (
                      <Badge key={cat} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 发布者 */}
            <Card>
              <CardHeader>
                <CardTitle>发布者</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-3">
                  <Link href={`/profile/${order.owner.username}`}>
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden">
                      {order.owner.avatar ? (
                        <img src={order.owner.avatar} alt={order.owner.name || order.owner.username} className="w-full h-full object-cover" />
                      ) : (
                        <span>{order.owner.name?.[0] || order.owner.username[0]}</span>
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${order.owner.username}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {order.owner.name || order.owner.username}
                    </Link>
                    {order.owner.verified && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        认证
                      </Badge>
                    )}
                    <div className="text-sm text-gray-500">
                      Lv.{order.owner.level}
                    </div>
                  </div>
                </div>
                {order.owner.bio && (
                  <p className="text-sm text-gray-600">{order.owner.bio}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
