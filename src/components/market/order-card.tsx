import Link from 'next/link'
import { Briefcase, Handshake, Calendar, Eye, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES, BUDGET_TYPES } from '@/constants/topics'

interface OrderCardProps {
  order: {
    id: string
    slug: string
    name: string
    tagline: string
    description: string
    contentType: string
    category: string[]
    skills: string[]
    budgetType: string | null
    budgetMin: number | null
    budgetMax: number | null
    deadline: Date | null
    contactType: string | null
    viewCount: number
    featured: boolean
    createdAt: Date
    owner: {
      id: string
      username: string
      name: string | null
      avatar: string | null
      verified: boolean
    }
  }
}

// 用 id 的字符 charCode 求和生成稳定虚拟浏览数（30-250之间）
const getVirtualViewCount = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (hash % 220) + 30
}

export function OrderCard({ order }: OrderCardProps) {
  const contentType = CONTENT_TYPES.find(t => t.id === order.contentType)
  const budgetType = BUDGET_TYPES.find(t => t.id === order.budgetType)

  // 需求紧急度标签
  const getUrgencyLabel = () => {
    const now = new Date()
    const created = new Date(order.createdAt)
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays <= 3) return { text: '最新', className: 'bg-orange-100 text-orange-600' }
    if (diffDays > 30) return { text: '较旧', className: 'bg-gray-100 text-gray-500' }
    return null
  }
  const urgencyLabel = getUrgencyLabel()

  const getContactLabel = () => {
    switch (order.contactType) {
      case 'wechat': return '微信'
      case 'feishu': return '飞书'
      case 'email': return '邮箱'
      default: return null
    }
  }

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

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        {/* 类型标签 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="flex items-center gap-1"
              style={{ borderColor: contentType?.color, color: contentType?.color }}
            >
              {order.contentType === 'DEMAND' ? (
                <Briefcase className="h-3 w-3" />
              ) : (
                <Handshake className="h-3 w-3" />
              )}
              {contentType?.name}
            </Badge>
            {urgencyLabel && (
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${urgencyLabel.className}`}>
                {urgencyLabel.text === '最新' ? '🔥 ' : '⏰ '}{urgencyLabel.text}
              </span>
            )}
          </div>
          {order.featured && (
            <Badge variant="default" className="text-xs">推荐</Badge>
          )}
        </div>

        {/* 标题 */}
        <Link
          href={`/market/${order.slug}`}
          className="block font-semibold text-lg text-secondary hover:text-primary transition-colors line-clamp-2 mb-2"
        >
          {order.name}
        </Link>

        {/* 简介 */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {order.tagline}
        </p>

        {/* 预算 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-primary">
            {getBudgetDisplay()}
          </span>
          {order.deadline && (
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(order.deadline), {
                locale: zhCN,
                addSuffix: true,
              })}截止
            </span>
          )}
        </div>

        {/* 分类标签 */}
        {order.category.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {order.category.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {cat}
              </span>
            ))}
            {order.category.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{order.category.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 发布者 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <span>发布者: </span>
            <Link
              href={`/profile/${order.owner.username}`}
              className="ml-1 text-secondary hover:text-primary transition-colors"
            >
              {order.owner.name || order.owner.username}
            </Link>
            {order.owner.verified && (
              <Badge variant="secondary" className="ml-1 text-xs py-0">认证</Badge>
            )}
          </div>
          {getContactLabel() && (
            <span className="flex items-center text-xs text-gray-400">
              <MessageCircle className="h-3 w-3 mr-0.5" />
              {getContactLabel()}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex items-center justify-between text-gray-500 text-sm">
        <span className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          {order.viewCount > 0 ? order.viewCount : getVirtualViewCount(order.id)} 浏览
        </span>
        <span>
          {formatDistanceToNow(new Date(order.createdAt), {
            locale: zhCN,
            addSuffix: true,
          })}
        </span>
      </CardFooter>
    </Card>
  )
}
