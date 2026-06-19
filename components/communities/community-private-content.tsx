'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, CheckCircle2, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageGallery } from '@/components/image-gallery'

interface EntryInfo {
  requirements?: string[]
  steps?: string[]
  duration?: string
}

interface PrivateData {
  entryInfo: EntryInfo | null
  realTips: string[]
  images: string[]
  amenities: string[]
  contactName: string | null
  contactPhone: string | null
  contactWechat: string | null
  contactNote: string | null
  unlocked: boolean
}

interface CommunityPrivateContentProps {
  slug: string
  entryFriendly?: number | null
  processTime?: string | null
  lastVerifiedAt?: string | null
}

function renderStars(n: number): string {
  const filled = Math.min(Math.max(n, 1), 5)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function CommunityPrivateContent({
  slug,
  entryFriendly,
  processTime,
  lastVerifiedAt,
}: CommunityPrivateContentProps) {
  const { data: session, status } = useSession()
  const [data, setData] = useState<PrivateData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    setLoading(true)
    fetch(`/api/community/${slug}/private`)
      .then((res) => res.json())
      .then((d: PrivateData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, session])

  if (status === 'loading') return null

  if (!session?.user) {
    const loginUrl = `/login?callbackUrl=/communities/${slug}`
    const registerUrl = `/register?callbackUrl=/communities/${slug}`
    return (
      <Card className="border-primary/20 bg-primary-soft/50">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">登录后查看入驻指南和联系方式</h3>
          <p className="text-sm text-mute mb-5">免费注册即可查看完整的入驻流程、真实提醒和联系方式</p>
          <div className="flex gap-3 justify-center">
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              登录查看
            </Link>
            <Link
              href={registerUrl}
              className="inline-flex items-center justify-center rounded-2xl border border-hairline px-6 py-2.5 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-surface-soft"
            >
              免费注册
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-surface-card rounded-2xl animate-pulse" />
        <div className="h-32 bg-surface-card rounded-2xl animate-pulse" />
        <div className="h-24 bg-surface-card rounded-2xl animate-pulse" />
      </div>
    )
  }

  const { entryInfo, realTips, amenities, images } = data
  const hasContact = !!(data.contactName || data.contactPhone || data.contactWechat)

  return (
    <div className="space-y-6">
      {/* 入驻指南 */}
      {entryInfo && (() => {
        const hasRequirements = (entryInfo.requirements?.length ?? 0) > 0
        const hasSteps = (entryInfo.steps?.length ?? 0) > 0
        const hasDuration = !!entryInfo.duration
        if (!hasRequirements && !hasSteps && !hasDuration) return null
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                入驻指南
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasRequirements && (
                <div>
                  <h4 className="text-sm font-semibold text-ink mb-2">入驻条件</h4>
                  <ul className="space-y-2">
                    {entryInfo.requirements!.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasSteps && (
                <div>
                  <h4 className="text-sm font-medium text-charcoal mb-3">申请流程</h4>
                  <ol className="space-y-3">
                    {entryInfo.steps!.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-mute leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {hasDuration && (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-card text-sm text-mute">
                    ⏱ {entryInfo.duration}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* 真实提醒 */}
      {realTips && realTips.length > 0 && (
        <div className="border border-orange-200 bg-primary-soft rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-semibold text-orange-800">🔍 真实提醒</span>
          </div>
          {(entryFriendly || processTime) && (
            <div className="flex items-center gap-4 text-sm text-charcoal mb-3">
              {entryFriendly && (
                <span>
                  <span className="font-medium">入驻友好度：</span>
                  {renderStars(entryFriendly)}
                </span>
              )}
              {processTime && (
                <span>
                  <span className="font-medium">实际周期：</span>
                  {processTime}
                </span>
              )}
            </div>
          )}
          <ul className="space-y-2">
            {realTips
              .filter((tip) => {
                if (!hasContact && (tip.includes('右侧') || tip.includes('联系我们') || tip.includes('入驻咨询电话'))) return false
                return true
              })
              .map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-charcoal">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
          </ul>
          {lastVerifiedAt && (
            <div className="text-right mt-3">
              <span className="text-xs text-ash">
                最后核实：{new Date(lastVerifiedAt).getFullYear()}年
                {new Date(lastVerifiedAt).getMonth() + 1}月
              </span>
            </div>
          )}
        </div>
      )}

      {/* 配套服务 */}
      {amenities && amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
              配套服务
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenities.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-surface-card text-charcoal text-sm rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 社区图集 */}
      {images && images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              社区图集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageGallery images={images} communityName="" />
          </CardContent>
        </Card>
      )}

    </div>
  )
}
