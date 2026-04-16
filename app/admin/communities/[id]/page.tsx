import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'

interface Props {
  params: { id: string }
}

async function getCommunity(id: string) {
  const community = await prisma.community.findUnique({
    where: { id },
  })
  return community
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '运营中', color: 'bg-green-100 text-green-800' },
  PENDING: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  INACTIVE: { label: '已停用', color: 'bg-gray-100 text-gray-800' },
}

const TYPE_LABELS: Record<string, string> = {
  ONLINE: '线上',
  OFFLINE: '线下',
  MIXED: '综合',
}

export default async function CommunityDetailPage({ params }: Props) {
  await requireStaff()
  const community = await getCommunity(params.id)

  if (!community) {
    notFound()
  }

  const statusInfo = STATUS_LABELS[community.status] || STATUS_LABELS.PENDING

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/communities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-secondary">{community.name}</h1>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          {community.featured && (
            <Badge className="bg-yellow-100 text-yellow-800">推荐</Badge>
          )}
        </div>
        <Link href={`/admin/communities/${community.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Slug</dt>
                <dd className="font-medium">{community.slug}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">类型</dt>
                <dd className="font-medium">{TYPE_LABELS[community.type]}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">城市</dt>
                <dd className="font-medium">
                  {community.city}
                  {community.district && ` · ${community.district}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">详细地址</dt>
                <dd className="font-medium">{community.address}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm text-gray-500">社区简介</dt>
                <dd className="font-medium whitespace-pre-wrap">{community.description}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* 位置信息 */}
        {(community.latitude || community.longitude) && (
          <Card>
            <CardHeader>
              <CardTitle>位置信息</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                经度: {community.longitude}, 纬度: {community.latitude}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 运营信息 */}
        <Card>
          <CardHeader>
            <CardTitle>运营信息</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gray-500">运营主体</dt>
                <dd className="font-medium">{community.operator || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">联系人</dt>
                <dd className="font-medium">{community.contactName || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">联系微信</dt>
                <dd className="font-medium">{community.contactWechat || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">联系电话</dt>
                <dd className="font-medium">{community.contactPhone || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">官网</dt>
                <dd className="font-medium">
                  {community.website ? (
                    <a
                      href={community.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {community.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">总面积</dt>
                <dd className="font-medium">{community.totalArea || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">总工位数</dt>
                <dd className="font-medium">{community.totalWorkstations || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* 标签与服务 */}
        <Card>
          <CardHeader>
            <CardTitle>标签与服务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500 mb-2">重点赛道</dt>
              <dd className="flex flex-wrap gap-2">
                {community.focusTracks.length > 0
                  ? community.focusTracks.map((f, i) => (
                      <Badge key={i} variant="outline">
                        {f}
                      </Badge>
                    ))
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-2">适合人群</dt>
              <dd className="flex flex-wrap gap-2">
                {community.suitableFor.length > 0
                  ? community.suitableFor.map((s, i) => (
                      <Badge key={i} variant="outline">
                        {s}
                      </Badge>
                    ))
                  : '-'}
              </dd>
            </div>
          </CardContent>
        </Card>

        {/* 政策与媒体 */}
        <Card>
          <CardHeader>
            <CardTitle>政策与媒体</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {community.benefits && (
              <div>
                <dt className="text-sm text-gray-500 mb-2">入驻政策（benefits）</dt>
                <dd>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(community.benefits, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
            {community.coverImage && (
              <div>
                <dt className="text-sm text-gray-500 mb-2">封面图</dt>
                <dd>
                  <img
                    src={community.coverImage}
                    alt="封面"
                    className="max-w-md rounded-lg"
                  />
                </dd>
              </div>
            )}
            {community.images.length > 0 && (
              <div>
                <dt className="text-sm text-gray-500 mb-2">图片列表</dt>
                <dd className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {community.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="rounded-lg" />
                  ))}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
