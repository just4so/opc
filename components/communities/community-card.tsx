import Link from 'next/link'
import { Star } from 'lucide-react'

const POLICY_KEYS = [
  { key: 'office',   label: '办公空间' },
  { key: 'compute',  label: '算力资源' },
  { key: 'business', label: '商业支持' },
  { key: 'funding',  label: '资金支持' },
  { key: 'housing',  label: '安居保障' },
] as const

interface CommunityCardProps {
  community: {
    id: string
    slug: string
    name: string
    city: string
    district?: string
    address: string
    description: string
    operator?: string
    totalWorkstations?: number | null
    benefits?: any
    featured: boolean
    entryFriendly?: number | null
    coverImage?: string | null
  }
}

export function CommunityCard({ community }: CommunityCardProps) {
  const benefits = community.benefits as Record<string, { summary?: string; items?: string[] }> | null

  // 判断某项政策是否存在（有 summary 或 items 才算有）
  function hasPolicy(key: string): boolean {
    if (!benefits) return false
    const section = benefits[key]
    if (!section) return false
    return !!(section.summary || (section.items && section.items.length > 0))
  }

  // 描述文字（去除 HTML，截取前 36 字）
  function getDesc(): string {
    const raw = community.description || ''
    const plain = raw
      .replace(/<\/p>\s*<p>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .trim()
    return plain.length > 36 ? plain.slice(0, 36) + '…' : plain
  }

  // 无封面时用城市首字做渐变占位
  const fallbackBg = 'linear-gradient(135deg, #FFF3ED 0%, #FDEBD0 100%)'

  return (
    <Link href={`/communities/${community.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.06)] transition-shadow duration-200">

        {/* 封面图 */}
        {community.coverImage ? (
          <div className="h-[110px] w-full overflow-hidden bg-gray-100">
            <img
              src={community.coverImage}
              alt={community.name}
              className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        ) : (
          <div
            className="h-[110px] w-full flex items-center justify-center"
            style={{ background: fallbackBg }}
          >
            <span className="text-[#F97316] text-sm font-semibold tracking-wide opacity-80">
              {community.city} OPC
            </span>
          </div>
        )}

        {/* 内容区 */}
        <div className="px-4 pt-3 pb-4">

          {/* 城市/区域 + 推荐 Badge */}
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] text-gray-400 tracking-wide">
              {community.city}{community.district ? ` · ${community.district}` : ''}
            </div>
            {community.featured && (
              <span className="text-[10px] font-semibold bg-orange-500 text-white px-[7px] py-[2px] rounded-full">
                推荐
              </span>
            )}
          </div>

          {/* 社区名称 */}
          <div className="text-[14px] font-semibold text-gray-900 leading-snug mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
            {community.name}
          </div>

          {/* 描述钩子 */}
          <p className="text-[12px] text-gray-400 leading-relaxed mb-3 line-clamp-2">
            {getDesc()}
          </p>

          {/* 入驻友好度 — Star 图标 */}
          {community.entryFriendly != null && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex gap-[2px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < community.entryFriendly!
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-400">入驻友好度</span>
            </div>
          )}

          {/* 分隔线 */}
          <div className="h-px bg-gray-100 mb-3" />

          {/* 五项政策标签 — 方案 D：有边框有背景，无边框只灰字 */}
          <div className="flex flex-wrap gap-[6px]">
            {POLICY_KEYS.map(({ key, label }) => {
              const active = hasPolicy(key)
              return (
                <span
                  key={key}
                  className={`text-[11px] px-[8px] py-[3px] rounded-[5px] ${
                    active
                      ? 'border border-orange-200 bg-orange-50 text-orange-500 font-medium'
                      : 'text-gray-300'
                  }`}
                >
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}
