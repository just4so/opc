import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin } from 'lucide-react'
import prisma from '@/lib/db'
import { CommunityCard } from '@/components/communities/community-card'

export const revalidate = 3600

interface PageProps {
  params: { city: string }
}

export async function generateStaticParams() {
  const cities = await prisma.community.findMany({
    where: { status: 'ACTIVE', city: { not: '' } },
    distinct: ['city'],
    select: { city: true },
  })

  return (cities as { city: string }[])
    .filter((c) => c.city.length > 0)
    .map((c) => ({
      city: c.city,
    }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const decodedCity = decodeURIComponent(params.city)

  return {
    title: `${decodedCity}OPC社区 - OPC创业者入驻攻略与社区大全 - OPC圈`,
    description: `查找${decodedCity}所有OPC社区信息：地址、入驻条件、政策支持、联系方式。OPC圈人工核实的${decodedCity}OPC社区大全，帮你找到合适的创业社区。`,
    alternates: {
      canonical: `https://www.opcquan.com/communities/city/${decodedCity}`,
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const decodedCity = decodeURIComponent(params.city)

  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE', city: decodedCity },
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      district: true,
      address: true,
      description: true,
      operator: true,
      totalWorkstations: true,
      benefits: true,
      featured: true,
      entryFriendly: true,
      coverImage: true,
    },
  })

  if (communities.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-hairline-soft">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-mute">
            <Link href="/" className="hover:text-primary transition-colors">首页</Link>
            <span>/</span>
            <Link href="/communities" className="hover:text-primary transition-colors">社区</Link>
            <span>/</span>
            <span className="text-ink font-medium">{decodedCity}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-primary-soft/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">
              {decodedCity}OPC社区
            </h1>
          </div>
          <p className="text-mute text-sm md:text-base max-w-2xl leading-relaxed">
            共收录 <span className="font-semibold text-primary">{communities.length}</span> 个{decodedCity}OPC社区。
            以下信息由 OPC圈 人工核实整理，包含地址、入驻条件、政策支持等详情。
          </p>
        </div>
      </div>

      {/* Community Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={{
                id: community.id,
                slug: community.slug,
                name: community.name,
                city: community.city,
                district: community.district ?? undefined,
                address: community.address ?? '',
                description: community.description ?? '',
                operator: community.operator ?? undefined,
                totalWorkstations: community.totalWorkstations,
                benefits: community.benefits,
                featured: community.featured,
                entryFriendly: community.entryFriendly,
                coverImage: community.coverImage ?? undefined,
              }}
              recommended={community.featured}
            />
          ))}
        </div>

        {communities.length === 0 && (
          <div className="text-center py-20">
            <p className="text-mute">暂无收录{decodedCity}的OPC社区</p>
            <Link href="/communities" className="text-primary hover:underline mt-4 inline-block">
              浏览全部社区 →
            </Link>
          </div>
        )}
      </div>

      {/* SEO Footer */}
      <div className="border-t border-hairline-soft bg-surface-card mt-8">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl mx-auto space-y-6 text-sm text-mute">
            <section>
              <h2 className="text-charcoal font-semibold mb-3">关于{decodedCity}OPC社区</h2>
              <p className="leading-relaxed">
                {decodedCity}是国内OPC（一人公司）创业者聚集的重要城市。
                OPC圈收录的{decodedCity}OPC社区涵盖各类产业园区、孵化器、众创空间，
                提供从免费工位到独立办公室的多种办公方案。
                创业者可根据需求选择最适合的入驻社区。
              </p>
            </section>

            <section>
              <h2 className="text-charcoal font-semibold mb-3">如何选择{decodedCity}的OPC社区？</h2>
              <ul className="space-y-2">
                <li>• 查看入驻条件：确认注册资本、行业方向等要求是否匹配</li>
                <li>• 了解政策支持：关注当地是否有针对OPC的租金补贴或税收优惠</li>
                <li>• 社群氛围：通过 OPC圈的创业者评价和真实提醒了解社区氛围</li>
              </ul>
            </section>

            <section>
              <h2 className="text-charcoal font-semibold mb-3">入驻申请</h2>
              <p className="leading-relaxed">
                找到合适的社区后，可通过 OPC圈「社区直通车」提交入驻申请，
                由 OPC圈 审核推荐给社区运营方，同时解锁社区联系方式。
                提交申请免费，不收取任何费用。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
