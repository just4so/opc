import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Metadata } from 'next'
import sanitizeHtml from 'sanitize-html'
import {
  MapPin,
  Building2,
  Phone,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Gift,
  Users,
  ExternalLink,
  FileText,
  ClipboardList,
  ScrollText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityLocationMap } from '@/components/communities/community-location-map'
import CommunityReviews from '@/components/communities/community-reviews'
import { LoginGate } from '@/components/communities/login-gate'
import { MobileRegisterBar } from '@/components/layout/mobile-register-bar'
import { CommunityFaq } from '@/components/communities/community-faq'
import { ImageGallery } from '@/components/image-gallery'
import { ContactUnlock } from '@/components/connect/contact-unlock'
import { FloatingConnectButton } from '@/components/connect/floating-connect-button'
import { CommunityClaimTrigger } from '@/components/communities/community-claim-trigger'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const revalidate = 60
export const dynamicParams = true

interface PageProps {
  params: { slug: string }
}

const getCommunity = cache(async (slug: string) => {
  const decodedSlug = decodeURIComponent(slug)

  const community = await prisma.community.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { id: decodedSlug },
      ],
    },
  })

  return community
})

async function getQrCodeUrl(): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'community_qrcode_url' }
  })
  return setting?.value ?? ''
}

async function getLocalPolicies(city: string, district: string | null) {
  return prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        // 区县级：精确匹配
        ...(district ? [{ city, district }] : []),
        // 市级：同城无区县
        { city, district: null },
        // 省级：无城市（province 匹配 city 字段，因直辖市省市同名）
        { city: null, province: city },
      ],
    },
    orderBy: [
      { district: { sort: 'desc', nulls: 'last' } },
      { city: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'asc' },
    ],
    take: 5,
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function renderDescription(text: string): string {
  if (!text) return ''
  // 如果已经是 HTML（富文本编辑器输出），直接返回，由 sanitizeHtml 做安全过滤
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  // 纯文本：按双换行分段
  return text.split('\n\n').filter(Boolean).map((p) => `<p>${p.trim()}</p>`).join('')
}

function renderStars(difficulty: number): string {
  const filled = Math.min(Math.max(difficulty, 1), 5)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function getFirstSentence(text: string): string {
  if (!text) return ''
  // 先剥离 HTML 标签，再提取第一句
  const plain = /<[a-z][\s\S]*>/i.test(text) ? stripHtml(text) : text
  const match = plain.match(/^[^。.！!？?]{1,100}[。.！!？?]?/)
  return match ? match[0].trim() : plain.slice(0, 100)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const community = await getCommunity(params.slug)

  if (!community) {
    return {
      title: '社区未找到 - OPC圈',
    }
  }

  const slug = community.slug
  const canonicalUrl = `https://www.opcquan.com/communities/${slug}`
  let description = stripHtml(community.description).slice(0, 160)

  // 追加政策关键词
  const localPolicies = await getLocalPolicies(community.city, community.district ?? null)
  if (localPolicies.length > 0) {
    const policyKeywords = localPolicies
      .slice(0, 3)
      .map((p) => p.title.slice(0, 20))
      .join('、')
    description = `${description} | 当地OPC政策：${policyKeywords}`
  }

  const ogImage = community.coverImage ?? 'https://www.opcquan.com/logo.png'

  return {
    title: `${community.name} - ${community.city}OPC社区入驻攻略 - OPC圈`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${community.name} | ${community.city}OPC社区`,
      description,
      url: canonicalUrl,
      siteName: 'OPC圈',
      locale: 'zh_CN',
      type: 'website',
      images: [{ url: ogImage, width: 800, height: 500, alt: community.name }],
    },
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const community = await getCommunity(params.slug)

  if (!community) {
    notFound()
  }

  const session = await auth()
  const isLoggedIn = !!session?.user
  const [qrCodeUrl, localPolicies] = await Promise.all([
    getQrCodeUrl(),
    getLocalPolicies(community.city, community.district ?? null),
  ])
  const registerUrl = `/register?callbackUrl=/communities/${community.slug}`
  const loginUrl = `/login?callbackUrl=/communities/${community.slug}`

  const tagline = getFirstSentence(community.description)

  return (
    <div className="min-h-screen bg-background">
      <Script
        id={`ld-community-${community.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: community.name,
            description: stripHtml(community.description).slice(0, 200),
            url: `https://www.opcquan.com/communities/${community.slug}`,
            address: community.address ? {
              '@type': 'PostalAddress',
              streetAddress: community.address,
              addressLocality: community.city,
              addressCountry: 'CN',
            } : undefined,
            ...(community.latitude && community.longitude ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: community.latitude,
                longitude: community.longitude,
              }
            } : {}),
            ...(community.contactPhone ? { telephone: community.contactPhone } : {}),
            ...(community.website ? { sameAs: [community.website] } : {}),
            ...(community.coverImage ? { image: community.coverImage } : {}),
          }),
        }}
      />
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/communities"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回社区列表
          </Link>
        </div>
      </div>

      {/* ===== Layer 1: 快速判断（始终可见）===== */}
      <div className="bg-white border-b">
        {/* 封面图（仅当有时才渲染） */}
        {community.coverImage && (
          <div className="relative w-full h-48 md:h-64 overflow-hidden">
            <Image
              src={community.coverImage}
              alt={community.name}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-6">
          {/* 名称 + 徽章 */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-secondary">{community.name}</h1>
            {community.featured && (
              <Badge variant="default">推荐</Badge>
            )}
            <Badge variant="outline">
              {community.type === 'ONLINE' ? '线上' : community.type === 'OFFLINE' ? '线下' : '综合'}
            </Badge>
          </div>

          {/* 城市 + 运营主体 */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{community.city}{community.district ? ` · ${community.district}` : ''}</span>
            </div>
            {community.operator && (
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                <span>{community.operator}</span>
              </div>
            )}
          </div>

          {/* 3 stat chips（仅有值时渲染） */}
          <div className="flex flex-wrap gap-3 mb-4">
            {community.totalWorkstations != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                <Users className="h-4 w-4 text-primary" />
                <span>{community.totalWorkstations} 个工位</span>
              </div>
            )}
            {community.totalArea && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{community.totalArea}{/^\d+$/.test(community.totalArea) ? '㎡' : ''}</span>
              </div>
            )}
            {community.entryFriendly != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full text-sm text-orange-700">
                <span className="font-medium">入驻友好度</span>
                <span>{renderStars(community.entryFriendly)}</span>
              </div>
            )}
            {community.benefits != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-sm text-amber-700">
                <Gift className="h-4 w-4" />
                <span>有政策支持</span>
              </div>
            )}
          </div>

          {/* 入驻方向标签 */}
          {community.focusTracks && community.focusTracks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {community.focusTracks.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* 一句话 tagline */}
          {tagline && (
            <p className="text-gray-500 text-sm">{tagline}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-8">

            {/* 社区详情 (Markdown) - 始终可见，SEO 友好 */}
            {community.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-primary" />
                    社区详情
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(renderDescription(community.description ?? ''), {
                        allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
                          'strong', 'em', 'b', 'i', 'u', 's', 'del', 'mark',
                          'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'br',
                          'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                        allowedAttributes: {
                          'a': ['href', 'target', 'rel'],
                          'img': ['src', 'alt', 'width', 'height'],
                          'td': ['colspan', 'rowspan'],
                          'th': ['colspan', 'rowspan'],
                        },
                        disallowedTagsMode: 'discard',
                      })
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* ===== Layer 2: 深度了解（登录可见）===== */}
            {!isLoggedIn ? (
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <CardContent className="pt-6 pb-6">
                  <h3 className="text-xl font-semibold mb-3">🔓 登录后解锁完整信息</h3>
                  <ul className="space-y-2 mb-5 text-sm text-white/90">
                    <li>✅ 五大入驻福利（办公空间、算力资源、资金支持等）</li>
                    <li>✅ 完整入驻指南（条件、流程、审核周期）</li>
                    <li>✅ 真实入驻说明（创业者经验）</li>
                    <li>✅ 政策详情 & 配套服务</li>
                    <li>✅ 精确地址 & 联系方式</li>
                  </ul>
                  <div className="flex gap-3">
                    <Link href={registerUrl} className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-orange-50">
                      立即免费注册
                    </Link>
                    <Link href={loginUrl} className="inline-flex items-center justify-center rounded-xl border border-white/80 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20">
                      已有账户，登录
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 入驻福利 */}
                {(() => {
                  type BenefitsSection = { summary?: string; items?: string[] }
                  type BenefitsJson = {
                    office?:   BenefitsSection
                    compute?:  BenefitsSection
                    business?: BenefitsSection
                    funding?:  BenefitsSection
                    housing?:  BenefitsSection
                  }
                  const benefitsSectionDefs: Array<{ key: keyof BenefitsJson; label: string }> = [
                    { key: 'office',   label: '办公空间' },
                    { key: 'compute',  label: '算力资源' },
                    { key: 'business', label: '业务拓展' },
                    { key: 'funding',  label: '资金支持' },
                    { key: 'housing',  label: '安居保障' },
                  ]
                  const benefits = community.benefits as BenefitsJson | null
                  if (!benefits) return null
                  const presentSections = benefitsSectionDefs.filter(({ key }) => !!benefits[key])
                  if (presentSections.length === 0) return null
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center"><FileText className="h-5 w-5 mr-2 text-primary" />入驻政策</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {presentSections.map(({ key, label }, idx) => {
                          const section = benefits[key]!
                          const hasItems = section.items && section.items.length > 0
                          return (
                            <div key={key}>
                              {idx > 0 && <div className="border-t border-gray-100 mb-4" />}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
                                {section.summary && !hasItems && (
                                  <span className="text-xs text-gray-400 font-normal">{section.summary}</span>
                                )}
                              </div>
                              {section.summary && hasItems && (
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{section.summary}</p>
                              )}
                              {hasItems && (
                                <ul className="space-y-1.5">
                                  {section.items!.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                                      <span className="text-orange-400 mt-0.5 flex-shrink-0 text-xs">▸</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {!hasItems && !section.summary && null}
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* 入驻指南（entryInfo） */}
                {(() => {
                  type EntryInfoJson = {
                    requirements?: string[]
                    steps?:        string[]
                    duration?:     string
                  }
                  const entryInfo = community.entryInfo as EntryInfoJson | null
                  if (!entryInfo) return null
                  const hasRequirements = (entryInfo.requirements?.length ?? 0) > 0
                  const hasSteps = (entryInfo.steps?.length ?? 0) > 0
                  const hasDuration = !!entryInfo.duration
                  if (!hasRequirements && !hasSteps && !hasDuration) return null
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-primary" />入驻指南</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {hasRequirements && (
                          <div>
                            <h4 className="text-sm font-semibold text-secondary mb-2">入驻条件</h4>
                            <ul className="space-y-2">
                              {entryInfo.requirements!.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasSteps && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">申请流程</h4>
                            <ol className="space-y-3">
                              {entryInfo.steps!.map((step, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {hasDuration && (
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600">
                              ⏱ {entryInfo.duration}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* 3. 真实入驻说明 */}
                {community.realTips && community.realTips.length > 0 && (
                  <div className="border-l-4 border-orange-400 bg-orange-50 rounded-r-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-semibold text-orange-800">🔍 真实提醒</span>
                    </div>
                    {(community.entryFriendly || community.processTime) && (
                      <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                        {community.entryFriendly && (
                          <span><span className="font-medium">入驻友好度：</span>{renderStars(community.entryFriendly)}</span>
                        )}
                        {community.processTime && (
                          <span><span className="font-medium">实际周期：</span>{community.processTime}</span>
                        )}
                      </div>
                    )}
                    <ul className="space-y-2">
                      {(community.realTips || [])
                        .filter(tip => {
                          // 如果右侧没有任何联系方式，过滤掉引导查看联系方式的tip
                          const hasContact = !!(community.contactPhone || community.contactName || community.contactWechat || community.website)
                          if (!hasContact && (tip.includes('右侧') || tip.includes('联系我们') || tip.includes('入驻咨询电话'))) return false
                          return true
                        })
                        .map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                    {community.lastVerifiedAt && (
                      <div className="text-right mt-3">
                        <span className="text-xs text-gray-400">
                          最后核实：{new Date(community.lastVerifiedAt).getFullYear()}年{new Date(community.lastVerifiedAt).getMonth() + 1}月
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 配套服务 */}
                {community.amenities && community.amenities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                        配套服务
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {community.amenities.map((item, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 5. 社区图集 */}
                {community.images && community.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-primary" />
                        社区图集
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageGallery
                        images={community.images}
                        communityName={community.name}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* ===== Layer 3: 参考资料（始终可见）===== */}

            {/* 创业者评价 */}
            <CommunityReviews slug={community.slug} />
          </div>

          {/* ===== 侧边栏 ===== */}
          <div className="space-y-6">
            {/* 社区位置地图 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  社区位置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommunityLocationMap
                  name={community.name}
                  city={community.city}
                  address={community.address}
                  latitude={community.latitude}
                  longitude={community.longitude}
                />
                {community.transit && (
                  <p className="text-sm text-gray-500 mt-2">🚇 {community.transit}</p>
                )}

              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card>
              <CardHeader>
                <CardTitle>联系信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {community.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">详细地址</div>
                      <LoginGate isLoggedIn={isLoggedIn} message="免费注册，查看精确地址" registerUrl={registerUrl}>
                        <div className="text-gray-700">{community.address}</div>
                      </LoginGate>
                    </div>
                  </div>
                )}
                {(community.contactName || community.contactPhone || community.contactWechat) && (
                  isLoggedIn ? (
                    <ContactUnlock
                      slug={community.slug}
                      contactName={community.contactName}
                      contactPhone={community.contactPhone}
                      contactWechat={community.contactWechat}
                      contactNote={community.contactNote}
                    />
                  ) : (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">联系信息</div>
                        <LoginGate isLoggedIn={isLoggedIn} message="注册后查看联系方式" registerUrl={registerUrl}>
                          {community.contactName && (
                            <div className="text-gray-700">{community.contactName}</div>
                          )}
                        </LoginGate>
                      </div>
                    </div>
                  )
                )}
                {community.website && (
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">官网</div>
                      <a
                        href={community.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        访问官网 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 本地政策支持 */}
            {localPolicies.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-sm font-semibold text-gray-700">
                    <ScrollText className="h-4 w-4 mr-2 text-gray-400" />
                    本地政策支持
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {localPolicies.map((policy) => {
                    const level = policy.district ? '区级' : policy.city ? '市级' : '省级'
                    const levelColor =
                      policy.district
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : policy.city
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-violet-50 text-violet-700 border border-violet-200'

                    return (
                      <div key={policy.id} className="py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-start gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${levelColor}`}
                          >
                            {level}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-800 leading-snug mb-0.5">
                              {policy.title.length > 26 ? policy.title.slice(0, 26) + '…' : policy.title}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-gray-400 truncate">
                                {policy.summary.length > 18 ? policy.summary.slice(0, 18) + '…' : policy.summary}
                              </p>
                              {policy.sourceUrl ? (
                                <a
                                  href={policy.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex-shrink-0 flex items-center gap-0.5"
                                >
                                  原文<ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-1">
                    <Link
                      href="/news#policies"
                      className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      查看全部政策 →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <CardContent className="py-6 text-center bg-gradient-to-b from-primary/5 to-white">
                <p className="text-sm font-semibold text-gray-800 mb-4 tracking-wide">加入 OPC 圈，遇见同路人</p>
                <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
                  <Image
                    src={qrCodeUrl}
                    alt="OPC社群二维码"
                    width={180}
                    height={180}
                    className="mx-auto rounded-xl"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
            <CommunityClaimTrigger communityId={community.id} communityName={community.name} />
          </div>
        </div>
      </div>
      <CommunityFaq
        communityName={community.name}
        city={community.city}
        entryFriendly={community.entryFriendly}
        focusTracks={community.focusTracks ?? []}
      />
      <MobileRegisterBar isLoggedIn={isLoggedIn} registerUrl={registerUrl} />
      {isLoggedIn && (
        <FloatingConnectButton slug={community.slug} communityName={community.name} />
      )}
    </div>
  )
}
