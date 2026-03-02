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
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityLocationMap } from '@/components/communities/community-location-map'
import prisma from '@/lib/db'

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

  const policies = community.policies as any || {}
  const links = community.links as Array<{ title: string; url: string }> || []

  return (
    <div className="min-h-screen bg-background">
      {/* 返回导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
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
        <div className="container mx-auto px-4 py-8">
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
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>

            {/* 入驻流程 */}
            {community.entryProcess.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>入驻流程</CardTitle>
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

            {/* 配套服务 */}
            {community.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>配套服务</CardTitle>
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
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 申请入驻 CTA */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">开启你的AI创业之旅</h3>
                <p className="text-white/90 text-sm mb-4">
                  入驻{community.name}，享受政策扶持与创业服务
                </p>
                {community.website ? (
                  <Button asChild variant="secondary" className="w-full">
                    <a href={community.website} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      立即申请入驻
                    </a>
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    暂无在线申请
                  </Button>
                )}
              </CardContent>
            </Card>

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
                      <div className="text-gray-700">{community.address}</div>
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
                      <div className="text-gray-700">{community.contactName}</div>
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
    </div>
  )
}
