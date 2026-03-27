import Link from 'next/link'
import { MapPin, Users, Building2, ChevronRight, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CommunityPolicies {
  spaceSubsidy?: Record<string, string>
  computeSubsidy?: string[]
  coreBenefits?: Record<string, string>
  vouchers?: Record<string, string>
  comprehensive?: string[]
  support?: string[]
}

const CITY_COLORS: Record<string, string> = {
  深圳: "bg-blue-50 text-blue-400",
  杭州: "bg-cyan-50 text-cyan-400",
  北京: "bg-red-50 text-red-400",
  上海: "bg-purple-50 text-purple-400",
  苏州: "bg-emerald-50 text-emerald-500",
  常州: "bg-teal-50 text-teal-400",
  无锡: "bg-sky-50 text-sky-400",
  成都: "bg-orange-50 text-orange-400",
}
function getCityColor(city: string) {
  return CITY_COLORS[city] ?? "bg-gray-50 text-gray-400"
}

interface CommunityCardProps {
  community: {
    id: string
    slug: string
    newSlug?: string | null
    name: string
    city: string
    district?: string
    address: string
    description: string
    operator?: string
    spaceSize?: string
    workstations?: number
    policies?: CommunityPolicies
    focus: string[]
    featured: boolean
    applyDifficulty?: number | null
    coverImage?: string | null
  }
}

export function CommunityCard({ community }: CommunityCardProps) {
  // 提取核心政策亮点
  const highlights: string[] = []

  if (community.policies) {
    const policies = community.policies as CommunityPolicies

    // 检查空间补贴
    if (policies.spaceSubsidy) {
      const rent = policies.spaceSubsidy['租金优惠'] || policies.spaceSubsidy['办公空间']
      if (rent) highlights.push(rent)
    }

    // 检查核心福利
    if (policies.coreBenefits) {
      const fund = policies.coreBenefits['启动资金']
      if (fund) highlights.push(fund)
    }

    // 检查算力补贴
    if (policies.computeSubsidy && policies.computeSubsidy.length > 0) {
      highlights.push(policies.computeSubsidy[0])
    }
  }

  return (
    <Link href={`/communities/${community.newSlug || community.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {/* 封面图 */}
        {community.coverImage ? (
          <div className="relative h-36 w-full overflow-hidden rounded-t-xl bg-gray-100">
            <img
              src={community.coverImage}
              alt={community.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className={`h-36 w-full rounded-t-xl flex items-center justify-center text-sm font-medium border-b ${getCityColor(community.city)}`}>
            {community.city}
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                {community.name}
              </CardTitle>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{community.city}{community.district ? ` · ${community.district}` : ''}</span>
              </div>
              {community.applyDifficulty != null && (
                <div className="flex items-center gap-1 mt-1" title={`入驻难度 ${community.applyDifficulty}/5`}>
                  <span className="text-xs text-gray-400">入驻难度</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < community.applyDifficulty!
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            {community.featured && (
              <Badge variant="default" className="ml-2">推荐</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 描述 */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {community.description}
          </p>

          {/* 政策亮点 */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {highlights.slice(0, 3).map((highlight, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-primary-50 text-primary border-primary-200">
                  {highlight.length > 15 ? highlight.substring(0, 15) + '...' : highlight}
                </Badge>
              ))}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
            <div className="flex items-center space-x-4">
              {community.operator && (
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span className="line-clamp-1">{community.operator}</span>
                </div>
              )}
              {community.workstations && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{community.workstations}工位</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
