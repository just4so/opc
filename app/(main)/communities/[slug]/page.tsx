import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  MapPin,
  Building2,
  Phone,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Gift,
  Cpu,
  Users,
  ExternalLink,
  AlertCircle,
  Heart,
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

// ISR：1小时静态缓存，社区数据低频变化
export const revalidate = 3600

// 预生成全部社区静态页，构建时一次性打数据库，之后 CDN 直出
export async function generateStaticParams() {
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  })
  return communities.map((c) => ({ slug: encodeURIComponent(c.slug) }))
}

interface PageProps {
  params: { slug: string }
}

async function getCommunity(slug: string) {
  // 解码 URL 编码的中文 slug
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
}

function renderStars(difficulty: number): string {
  const filled = Math.min(Math.max(difficulty, 1), 5)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const community = await getCommunity(params.slug)

  if (!community) {
    return {
      title: '社区未找到 - OPC创业圈',
    }
  }

  return {
    title: `${community.name} - ${community.city}OPC社区 - OPC创业圈`,
    description: community.description.substring(0, 160),
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const community = await getCommunity(params.slug)

  if (!community) {
    notFound()
  }

  const session = await auth()
  const isLoggedIn = !!session?.user
  const registerUrl = `/register?callbackUrl=/communities/${community.slug}`
  const loginUrl = `/login?callbackUrl=/communities/${community.slug}`

  const policies = community.policies as any || {}
  const links = community.links as Array<{ title: string; url: string }> || []

  return (
    <div className="min-h-screen bg-background">
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

      {/* 社区头部 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-secondary">
                  {community.name}
                </h1>
                {community.featured && (
                  <Badge variant="default">推荐</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
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
                {community.workstations && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{community.workstations}个工位</span>
                  </div>
                )}
              </div>
            </div>
            {community.website && (
              <Button asChild>
                <a href={community.website} target="_blank" rel="noopener noreferrer">
                  访问官网 <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 社区简介 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  社区简介
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {community.description}
                </p>
              </CardContent>
            </Card>

            {/* 入驻政策 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="h-5 w-5 mr-2 text-primary" />
                  入驻政策
                  {!isLoggedIn && Object.keys(policies).length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
                      🎁 此社区有政策扶持
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <LoginGate isLoggedIn={isLoggedIn} message="注册后查看政策详情" registerUrl={registerUrl}>
                {/* 空间补贴 */}
                {policies.spaceSubsidy && Object.keys(policies.spaceSubsidy).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3">空间补贴</h4>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <table className="w-full">
                        <tbody>
                          {Object.entries(policies.spaceSubsidy).map(([key, value]) => (
                            <tr key={key} className="border-b border-primary-100 last:border-0">
                              <td className="py-2 text-gray-600 w-1/3">{key}</td>
                              <td className="py-2 font-medium text-primary">{value as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 核心福利 */}
                {policies.coreBenefits && Object.keys(policies.coreBenefits).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3">核心福利</h4>
                    <div className="bg-green-50 rounded-lg p-4">
                      <table className="w-full">
                        <tbody>
                          {Object.entries(policies.coreBenefits).map(([key, value]) => (
                            <tr key={key} className="border-b border-green-100 last:border-0">
                              <td className="py-2 text-gray-600 w-1/3">{key}</td>
                              <td className="py-2 font-medium text-green-700">{value as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 算力补贴 */}
                {policies.computeSubsidy && policies.computeSubsidy.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3 flex items-center">
                      <Cpu className="h-4 w-4 mr-2" />
                      算力补贴
                    </h4>
                    <ul className="space-y-2">
                      {policies.computeSubsidy.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 政策券 */}
                {policies.vouchers && Object.keys(policies.vouchers).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3">政策券支持</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(policies.vouchers).map(([key, value]) => (
                        <div key={key} className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-sm text-gray-600">{key}</div>
                          <div className="font-semibold text-blue-700">{value as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 综合政策 */}
                {policies.comprehensive && policies.comprehensive.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3">综合政策</h4>
                    <ul className="space-y-2">
                      {policies.comprehensive.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 配套政策 */}
                {policies.support && policies.support.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-3">配套政策</h4>
                    <div className="flex flex-wrap gap-2">
                      {policies.support.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                </LoginGate>
              </CardContent>
            </Card>

            {/* 真实入驻说明 */}
            {community.realTips.length > 0 && (
              <Card className="border-l-4 border-orange-400 bg-orange-50">
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center">
                      🔍 真实入驻说明
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                        👥 创业者说
                      </span>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      基于公开信息整理，区别于官方宣传
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.applyDifficulty && (
                    <div className="text-gray-700">
                      <span className="font-medium">申请难度：</span>
                      {renderStars(community.applyDifficulty)}
                    </div>
                  )}
                  {community.processTime && (
                    <div className="text-gray-700">
                      <span className="font-medium">实际周期：</span>
                      {community.processTime}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-700 mb-2">注意事项：</div>
                    <ul className="space-y-1">
                      {community.realTips.map((tip, index) => (
                        <li key={index} className="text-gray-600 text-sm">
                          · {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {community.lastVerifiedAt && (
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        最后核实：{new Date(community.lastVerifiedAt).getFullYear()}年{new Date(community.lastVerifiedAt).getMonth() + 1}月
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 创业者评价 */}
            <CommunityReviews slug={community.slug} />

            {/* 入驻流程 */}
            {community.entryProcess.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isLoggedIn
                      ? '入驻流程'
                      : `入驻流程（共${community.entryProcess.length}步）`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LoginGate isLoggedIn={isLoggedIn} message="注册后查看完整流程" registerUrl={registerUrl}>
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
                  </LoginGate>
                </CardContent>
              </Card>
            )}

            {/* 配套服务 */}
            {community.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>配套服务</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {community.services.slice(0, isLoggedIn ? undefined : 2).map((service, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{service}</span>
                      </li>
                    ))}
                  </ul>
                  {!isLoggedIn && community.services.length > 2 && (
                    <div className="mt-3">
                      <LoginGate
                        isLoggedIn={isLoggedIn}
                        message={`还有${community.services.length - 2}项服务，注册后查看全部`}
                        registerUrl={registerUrl}
                      >
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {community.services.slice(2).map((service, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{service}</span>
                            </li>
                          ))}
                        </ul>
                      </LoginGate>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 申请入驻 CTA */}
            {isLoggedIn ? (
              <Card>
                <CardContent className="pt-6">
                  <Button variant="outline" className="w-full" disabled>
                    <Heart className="h-4 w-4 mr-2" />
                    收藏社区
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
                  <p className="text-center text-sm text-white/70 mt-3">
                    已有账户？<Link href={loginUrl} className="text-white underline">登录</Link>
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

            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
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
                {community.spaceSize && (
                  <div className="flex items-start">
                    <Building2 className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">空间面积</div>
                      <div className="text-gray-700">{community.spaceSize}</div>
                    </div>
                  </div>
                )}
                {community.contactName && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">联系人</div>
                      <LoginGate isLoggedIn={isLoggedIn} message="注册后查看联系人和微信" registerUrl={registerUrl}>
                        <div className="text-gray-700">{community.contactName}</div>
                      </LoginGate>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 适合人群 */}
            {community.suitableFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>适合人群</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {community.suitableFor.map((item, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Users className="h-4 w-4 text-primary mr-2 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 注意事项 */}
            {community.notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    注意事项
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {community.notes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {index + 1}. {note}
                      </li>
                    ))}
                  </ul>
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
          </div>
        </div>
      </div>
      <MobileRegisterBar isLoggedIn={isLoggedIn} registerUrl={registerUrl} />
    </div>
  )
}
