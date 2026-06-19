import { cache } from 'react'
import { getCityProvince } from '@/lib/china-regions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Metadata } from 'next'
import sanitizeHtml from 'sanitize-html'
import {
  MapPin,
  Building2,
  Globe,
  ArrowLeft,
  Gift,
  Users,
  ExternalLink,
  FileText,
  ScrollText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityLocationMap } from '@/components/communities/community-location-map'
import CommunityReviews from '@/components/communities/community-reviews'
import { MobileRegisterBar } from '@/components/layout/mobile-register-bar'
import { CommunityFaq } from '@/components/communities/community-faq'
import { FloatingConnectButton } from '@/components/connect/floating-connect-button'
import { CommunityClaimTrigger } from '@/components/communities/community-claim-trigger'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { CommunityPrivateContent } from '@/components/communities/community-private-content'
import prisma from '@/lib/db'
import { ensureUrl } from '@/lib/utils'

export const revalidate = 3600

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  try {
    const communities = await prisma.community.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true },
    })
    return communities.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
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
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      district: true,
      operator: true,
      description: true,
      benefits: true,
      focusTracks: true,
      totalWorkstations: true,
      totalArea: true,
      entryFriendly: true,
      coverImage: true,
      address: true,
      transit: true,
      latitude: true,
      longitude: true,
      featured: true,
      lastVerifiedAt: true,
      processTime: true,
      website: true,
      type: true,
      status: true,
      // For hasContact computation — deleted before rendering
      contactName: true,
      contactPhone: true,
      contactWechat: true,
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
  const province = getCityProvince(city) ?? city
  return prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        ...(district ? [{ city, district }] : []),
        { city, district: null },
        { city: null, province },
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
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text.split('\n\n').filter(Boolean).map((p) => `<p>${p.trim()}</p>`).join('')
}

function renderStars(difficulty: number): string {
  const filled = Math.min(Math.max(difficulty, 1), 5)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function getFirstSentence(text: string): string {
  if (!text) return ''
  const plain = /<[a-z][\s\S]*>/i.test(text) ? stripHtml(text) : text
  const match = plain.match(/^[^。.！!？?]{1,100}[。.！!？?]?/)
  return match ? match[0].trim() : plain.slice(0, 100)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const community = await getCommunity(params.slug)

  if (!community) {
    return { title: '社区未找到 - OPC圈' }
  }

  const slug = community.slug
  const canonicalUrl = `https://www.opcquan.com/communities/${slug}`
  let description = stripHtml(community.description).slice(0, 160)

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
    alternates: { canonical: canonicalUrl },
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
  const full = await getCommunity(params.slug)

  if (!full) {
    notFound()
  }

  // Option A: extract contact fields for hasContact boolean, don't render them
  const { contactName, contactPhone, contactWechat, ...community } = full
  const hasContact = !!(contactName || contactPhone || contactWechat)

  const [qrCodeUrl, localPolicies] = await Promise.all([
    getQrCodeUrl(),
    getLocalPolicies(community.city, community.district ?? null),
  ])

  const registerUrl = `/register?callbackUrl=/communities/${community.slug}`
  const tagline = getFirstSentence(community.description)

  return (
    <div className="min-h-screen bg-background">
      <Script
        id={`ld-breadcrumb-${community.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'OPC圈', item: 'https://www.opcquan.com' },
              { '@type': 'ListItem', position: 2, name: '社区列表', item: 'https://www.opcquan.com/communities' },
              { '@type': 'ListItem', position: 3, name: community.name, item: `https://www.opcquan.com/communities/${community.slug}` },
            ],
          }),
        }}
      />
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
            ...(community.website ? { sameAs: [community.website] } : {}),
            ...(community.coverImage ? { image: community.coverImage } : {}),
          }),
        }}
      />
      {/* 返回导航 */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/communities"
            className="inline-flex items-center text-mute hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回社区列表
          </Link>
        </div>
      </div>

      {/* ===== Layer 1: 快速判断（始终可见）===== */}
      <div className="bg-canvas border-b">
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
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-ink">{community.name}</h1>
            {community.featured && (
              <Badge variant="default">推荐</Badge>
            )}
            <Badge variant="outline">
              {community.type === 'ONLINE' ? '线上' : community.type === 'OFFLINE' ? '线下' : '综合'}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-mute mb-4">
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

          <div className="flex flex-wrap gap-3 mb-4">
            {community.totalWorkstations != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card rounded-full text-sm text-charcoal">
                <Users className="h-4 w-4 text-primary" />
                <span>{community.totalWorkstations} 个工位</span>
              </div>
            )}
            {community.totalArea && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card rounded-full text-sm text-charcoal">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{community.totalArea}{/^\d+$/.test(community.totalArea) ? '㎡' : ''}</span>
              </div>
            )}
            {community.entryFriendly != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-soft rounded-full text-sm text-primary">
                <span className="font-medium">入驻友好度</span>
                <span>{renderStars(community.entryFriendly)}</span>
              </div>
            )}
            {community.benefits != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-soft rounded-full text-sm text-primary">
                <Gift className="h-4 w-4" />
                <span>有政策支持</span>
              </div>
            )}
          </div>

          {community.focusTracks && community.focusTracks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {community.focusTracks.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-soft text-primary text-xs rounded-full font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {tagline && (
            <p className="text-mute text-sm">{tagline}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-8">

            {/* 社区详情 (始终可见) */}
            {community.description && (
              <ScrollReveal>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-primary" />
                    社区详情
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-charcoal"
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
              </ScrollReveal>
            )}

            {/* 入驻政策 (始终可见) */}
            <ScrollReveal>
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
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      入驻政策
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {presentSections.map(({ key, label }, idx) => {
                      const section = benefits[key]!
                      const hasItems = section.items && section.items.length > 0
                      return (
                        <div key={key}>
                          {idx > 0 && <div className="border-t border-hairline-soft mb-4" />}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-sm font-semibold text-ink">{label}</h4>
                            {section.summary && !hasItems && (
                              <span className="text-xs text-ash font-normal">{section.summary}</span>
                            )}
                          </div>
                          {section.summary && hasItems && (
                            <p className="text-xs text-mute mb-2 leading-relaxed">{section.summary}</p>
                          )}
                          {hasItems && (
                            <ul className="space-y-1.5">
                              {section.items!.map((item, i) => (
                                <li key={i} className="text-sm text-mute leading-relaxed flex items-start gap-2">
                                  <span className="text-orange-400 mt-0.5 flex-shrink-0 text-xs">▸</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })()}
            </ScrollReveal>

            {/* ===== Layer 2: 深度了解（客户端按登录状态加载）===== */}
            <CommunityPrivateContent
              slug={community.slug}
              entryFriendly={community.entryFriendly}
              processTime={community.processTime}
              lastVerifiedAt={community.lastVerifiedAt?.toISOString() ?? null}
              website={community.website}
            />

            {/* 创业者评价 */}
            <CommunityReviews slug={community.slug} />
          </div>

          {/* ===== 侧边栏 ===== */}
          <ScrollReveal delay={200} className="space-y-6">
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
                  <p className="text-sm text-mute mt-2">🚇 {community.transit}</p>
                )}
              </CardContent>
            </Card>

            {/* 联系信息 (地址 + 官网) */}
            {(community.address || community.website) && (
              <Card>
                <CardHeader>
                  <CardTitle>联系信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-ash mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm text-mute">详细地址</div>
                        <div className="text-charcoal text-sm">{community.address}</div>
                      </div>
                    </div>
                  )}
                  {community.website && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-ash mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm text-mute">官网</div>
                        <a
                          href={ensureUrl(community.website ?? '')}
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
            )}

            {/* 本地政策支持 */}
            {localPolicies.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-sm font-semibold text-charcoal">
                    <ScrollText className="h-4 w-4 mr-2 text-ash" />
                    本地政策支持
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {localPolicies.map((policy) => {
                    const level = policy.district ? '区级' : policy.city ? '市级' : '省级'
                    const levelColor =
                      policy.district
                        ? 'bg-primary-soft text-primary border border-primary/20'
                        : policy.city
                        ? 'bg-surface-card text-mute border border-hairline-soft'
                        : 'bg-surface-card text-ash border border-hairline-soft'

                    return (
                      <div key={policy.id} className="py-2 border-b border-hairline-soft last:border-0">
                        <div className="flex items-start gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${levelColor}`}
                          >
                            {level}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-ink leading-snug mb-0.5">
                              {policy.title.length > 26 ? policy.title.slice(0, 26) + '…' : policy.title}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-ash truncate">
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
                      className="text-xs text-ash hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      查看全部政策 →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border-primary/10">
              <CardContent className="py-6 text-center bg-gradient-to-b from-primary/5 to-white">
                <p className="text-sm font-semibold text-ink mb-4 tracking-wide">加入 OPC 圈，遇见同路人</p>
                <div className="inline-flex rounded-2xl bg-canvas p-3 ring-1 ring-hairline-soft">
                  <Image
                    src={qrCodeUrl}
                    alt="OPC社群二维码"
                    width={180}
                    height={180}
                    className="mx-auto rounded-2xl"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
            <CommunityClaimTrigger communityId={community.id} communityName={community.name} />
          </ScrollReveal>
        </div>
      </div>
      <CommunityFaq
        communityName={community.name}
        city={community.city}
        entryFriendly={community.entryFriendly}
        focusTracks={community.focusTracks ?? []}
      />
      <MobileRegisterBar registerUrl={registerUrl} />
      <FloatingConnectButton
        slug={community.slug}
        communityName={community.name}
        hasContact={hasContact}
      />
    </div>
  )
}
