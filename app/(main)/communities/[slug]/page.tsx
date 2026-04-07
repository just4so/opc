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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityLocationMap } from '@/components/communities/community-location-map'
import CommunityReviews from '@/components/communities/community-reviews'
import { LoginGate } from '@/components/communities/login-gate'
import { MobileRegisterBar } from '@/components/layout/mobile-register-bar'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import type { CommunityPolicies } from '@/lib/types/community'

export const revalidate = 3600
export const dynamicParams = true

interface PageProps {
  params: { slug: string }
}

const getCommunity = cache(async (slug: string) => {
  const decodedSlug = decodeURIComponent(slug)

  const community = await prisma.community.findFirst({
    where: {
      OR: [
        { newSlug: decodedSlug },
        { slug: decodedSlug },
        { id: decodedSlug },
      ],
    },
  })

  if (community && !community.newSlug) {
    console.warn(`[community] newSlug is null for community id=${community.id} slug=${community.slug}`)
  }

  return community
})

async function getQrCodeUrl(): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'community_qrcode_url' }
  })
  return setting?.value ?? ''
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

  const slug = community.newSlug ?? community.slug
  const canonicalUrl = `https://www.opcquan.com/communities/${slug}`
  const description = stripHtml(community.description).slice(0, 160)
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
  const qrCodeUrl = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/qrcode/wechat-group.png'
  const registerUrl = `/register?callbackUrl=/communities/${community.newSlug ?? community.slug}`
  const loginUrl = `/login?callbackUrl=/communities/${community.newSlug ?? community.slug}`

  const policies = (community.policies as CommunityPolicies) || {}
  const links = Array.isArray(community.links) ? community.links as Array<{ title: string; url: string }> : []
  const hasPolicies = !!(policies.policy_name || policies.price_range || policies.support_directions)
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
            url: `https://www.opcquan.com/communities/${community.newSlug ?? community.slug}`,
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
            {community.workstations != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                <Users className="h-4 w-4 text-primary" />
                <span>{community.workstations} 个工位</span>
              </div>
            )}
            {community.spaceSize && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{community.spaceSize}</span>
              </div>
            )}
            {community.applyDifficulty != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full text-sm text-orange-700">
                <span className="font-medium">入驻友好度</span>
                <span>{renderStars(community.applyDifficulty)}</span>
              </div>
            )}
            {hasPolicies && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-sm text-amber-700">
                <Gift className="h-4 w-4" />
                <span>有政策扶持</span>
              </div>
            )}
          </div>

          {/* suitableFor tags */}
          {community.suitableFor.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {community.suitableFor.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                >
                  <Users className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* focus tags */}
          {community.focus.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {community.focus.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* 一句话 tagline */}
          {tagline && (
            <p className="text-gray-500 text-sm italic">{tagline}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-8">

            {/* ===== Layer 2: 深度了解（登录可见）===== */}
            {!isLoggedIn ? (
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <CardContent className="pt-6 pb-6">
                  <h3 className="text-xl font-semibold mb-3">🔓 登录后解锁完整信息</h3>
                  <ul className="space-y-2 mb-5 text-sm text-white/90">
                    <li>✅ 政策扶持详情（空间补贴、算力补贴等）</li>
                    <li>✅ 完整入驻流程（{community.entryProcess.length} 步）</li>
                    <li>✅ 真实入驻说明（创业者经验）</li>
                    <li>✅ 配套服务详情</li>
                    <li>✅ 精确地址 & 联系方式</li>
                  </ul>
                  <div className="flex gap-3">
                    <Button asChild variant="secondary" className="bg-white text-primary hover:bg-orange-50 border-0">
                      <Link href={registerUrl}>立即免费注册</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white text-white bg-transparent hover:bg-white/20 hover:text-white">
                      <Link href={loginUrl}>已有账户，登录</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 1. 入驻政策 */}
                {hasPolicies && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Gift className="h-5 w-5 mr-2 text-primary" />
                        入驻政策
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {policies.policy_name && (
                        <div>
                          <span className="text-sm font-semibold text-secondary">政策名称</span>
                          <p className="mt-1 text-gray-700">{policies.policy_name}</p>
                        </div>
                      )}
                      {policies.price_range && (
                        <div>
                          <span className="text-sm font-semibold text-secondary">费用/补贴</span>
                          <p className="mt-1 text-gray-700">{policies.price_range}</p>
                        </div>
                      )}
                      {policies.support_directions && (
                        <div>
                          <span className="text-sm font-semibold text-secondary">支持方向</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {policies.support_directions.split(/[,，、]/).map((dir, i) => (
                              <Badge key={i} variant="outline">{dir.trim()}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {policies.policy_interpretation && (
                        <div>
                          <span className="text-sm font-semibold text-secondary">政策解读</span>
                          <p className="mt-1 text-sm text-gray-500">{policies.policy_interpretation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 2. 入驻流程 */}
                {community.entryProcess.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📋 入驻流程</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="relative border-l border-gray-200 ml-3">
                        {community.entryProcess.map((step, index) => (
                          <li key={index} className="mb-6 ml-6 last:mb-0">
                            <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white">
                              <span className="text-white font-semibold text-sm">{index + 1}</span>
                            </span>
                            <p className="text-gray-700">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* 3. 真实入驻说明（橙色 callout 卡片） */}
                {community.realTips.length > 0 && (
                  <div className="border-l-4 border-orange-400 bg-orange-50 rounded-r-lg p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-orange-800">🔍 真实入驻说明</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                        👥 创业者说
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 mb-4">基于公开信息整理，区别于官方宣传</p>
                    {community.applyDifficulty && (
                      <div className="text-gray-700 mb-2">
                        <span className="font-medium">入驻友好度：</span>
                        {renderStars(community.applyDifficulty)}
                      </div>
                    )}
                    {community.processTime && (
                      <div className="text-gray-700 mb-3">
                        <span className="font-medium">实际周期：</span>
                        {community.processTime}
                      </div>
                    )}
                    <ul className="space-y-2">
                      {community.realTips
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
                {community.services.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>⚙️ 配套服务</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {community.services.map((service, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{service}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* 5. 社区图集 */}
                {community.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-primary" />
                        社区图集
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {community.images.map((src, index) => (
                          <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={src}
                              alt={`${community.name} 图片 ${index + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* ===== Layer 3: 参考资料（始终可见）===== */}

            {/* 社区详情 (Markdown) */}
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

            {/* 参考链接 */}
            {links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-blue-500" />
                    参考链接
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {links.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          {link.title}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 创业者评价 */}
            <CommunityReviews slug={community.newSlug ?? community.slug} />
          </div>

          {/* ===== 侧边栏 ===== */}
          <div className="space-y-6">
            {/* CTA 卡片 */}
            {!isLoggedIn && (
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3">🔓 注册后立即解锁</h3>
                  <ul className="space-y-2 mb-4 text-sm text-white/90">
                    <li>✅ 精确地址</li>
                    <li>✅ 联系人和微信</li>
                    <li>✅ 完整入驻流程</li>
                    <li>✅ 配套服务详情</li>
                    <li>✅ 政策扶持详情</li>
                  </ul>
                  <Button asChild variant="secondary" className="bg-white text-primary hover:bg-orange-50 border-0 w-full">
                    <Link href={registerUrl}>立即免费注册</Link>
                  </Button>
                  <p className="text-center text-sm text-white/80 mt-3">
                    已有账户？<Link href={loginUrl} className="font-semibold text-white underline underline-offset-2 hover:opacity-80">登录</Link>
                  </p>
                </CardContent>
              </Card>
            )}

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
                {!isLoggedIn && (
                  <p className="mt-2 text-sm text-primary">
                    <Link href={registerUrl} className="hover:underline">
                      📍 注册后查看精确地址和路线
                    </Link>
                  </p>
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
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">联系信息</div>
                      <LoginGate isLoggedIn={isLoggedIn} message="注册后查看联系方式" registerUrl={registerUrl}>
                        {community.contactName && (
                          <div className="text-gray-700">{community.contactName}</div>
                        )}
                        {community.contactWechat && (
                          <div className="text-sm text-gray-500 mt-0.5">公众号：{community.contactWechat}</div>
                        )}
                        {community.contactPhone && (
                          <div className="text-sm text-gray-500 mt-0.5">电话：{community.contactPhone}</div>
                        )}
                      </LoginGate>
                    </div>
                  </div>
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
          </div>
        </div>
      </div>
      <MobileRegisterBar isLoggedIn={isLoggedIn} registerUrl={registerUrl} />
    </div>
  )
}
