import Link from 'next/link'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'OPC圈 · 一人公司，不必一个人摸索',
  description: '最真最全的一人公司OPC社区信息平台。人工核实 + 创业者共创，收录全国OPC社区，提供真实入驻攻略、费用对比、政策福利，是一人公司创业者找OPC社区的首选平台。',
  keywords: 'OPC社区,一人公司,OPC圈,OPC创业,联合办公,一人公司社区,OPC入驻,opcquan',
}

const getHomeStats = unstable_cache(
  async () => {
    const [total, cities] = await Promise.all([
      prisma.community.count({ where: { status: 'ACTIVE' } }),
      prisma.community.groupBy({
        by: ['city'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
    ])
    return { total, cityCount: cities.length }
  },
  ['home-stats-v2'],
  { revalidate: 600 }
)

const getLatestCreators = unstable_cache(
  async () =>
    prisma.user.findMany({
      where: { showInPlaza: true },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take: 4,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        mainTrack: true,
        location: true,
        verified: true,
      },
    }),
  ['home-creators'],
  { revalidate: 600 }
)

const getLatestRadarIssue = unstable_cache(
  async () =>
    prisma.radarIssue.findFirst({
      orderBy: { issueNo: 'desc' },
      select: {
        issueNo: true,
        publishedAt: true,
        title: true,
        summary: true,
        items: {
          orderBy: { importance: 'desc' },
          take: 3,
          select: { id: true, title: true, source: true, city: true },
        },
      },
    }),
  ['home-radar-v2'],
  { revalidate: 600 }
)

export default async function HomePage() {
  const [stats, creators, radarIssue] = await Promise.all([
    getHomeStats(),
    getLatestCreators(),
    getLatestRadarIssue(),
  ])

  return (
    <div className="flex flex-col">
      {/* ===== 第一屏：Hero ===== */}
      <section className="bg-surface-soft py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-[28px] md:text-[44px] font-bold leading-[1.15] tracking-tight text-ink mb-4">
            OPC创业者，在这里找到社区、被行业看见。
          </h1>
          <p className="text-base text-mute mb-8">
            全国 {stats.total} 个 OPC 社区 · 覆盖 {stats.cityCount} 个城市
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/communities"
              className="bg-primary text-on-primary rounded-xl px-8 py-4 font-semibold text-center hover:bg-primary-600 transition-colors"
            >
              找社区入驻
            </Link>
            <Link
              href="/settings"
              className="border border-hairline bg-canvas rounded-xl px-8 py-4 font-semibold text-center text-ink hover:bg-surface-soft transition-colors"
            >
              展示我的项目
            </Link>
          </div>
          <p className="text-sm text-ash">
            不确定？先看看
            <Link href="/communities" className="underline hover:text-mute transition-colors">
              全国 OPC 社区的分布 →
            </Link>
          </p>
        </div>
      </section>

      {/* ===== 第二屏：平台价值 ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '\u{1F3E2}',
                title: `${stats.total}个社区，帮你对接入驻`,
                desc: '全国OPC社区收录，真实信息人工核实，一键对接入驻',
                href: '/communities',
              },
              {
                emoji: '\u{1F4E3}',
                title: '认证创业者，进入媒体推荐池',
                desc: '展示你的项目，获得认证标识，进入行业推荐视野',
                href: '/connect',
              },
              {
                emoji: '\u{1F91D}',
                title: '创业者广场，找到合作伙伴',
                desc: '和真实创业者连接，找到志同道合的伙伴',
                href: '/plaza',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-surface-card rounded-2xl p-8 hover:shadow-soft transition group"
              >
                <span className="text-3xl mb-4 block">{item.emoji}</span>
                <h3 className="text-[22px] font-semibold leading-[1.25] text-ink mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-mute mb-4">{item.desc}</p>
                <span className="text-sm text-mute group-hover:text-primary transition-colors">
                  了解更多 →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 第三屏：最新创业者 ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-ink mb-8">
            最新入驻的创业者
          </h2>
          {creators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {creators.map((creator) => (
                <div key={creator.id} className="bg-surface-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-hairline-soft flex items-center justify-center text-mute text-lg">
                        {(creator.name || creator.username)?.[0] || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink truncate">
                          {creator.name || creator.username}
                        </span>
                        {creator.verified && (
                          <span className="shrink-0 bg-primary text-on-primary text-xs px-1.5 py-0.5 rounded-full">
                            认证
                          </span>
                        )}
                      </div>
                      {creator.mainTrack && (
                        <p className="text-xs text-mute truncate">{creator.mainTrack}</p>
                      )}
                    </div>
                  </div>
                  {creator.location && (
                    <p className="text-xs text-ash mb-2">{creator.location}</p>
                  )}
                  {creator.bio && (
                    <p className="text-sm text-body line-clamp-2">{creator.bio}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-mute">创业者卡片即将上线，敬请期待</p>
          )}
          <div className="mt-6">
            <Link
              href="/plaza"
              className="text-sm text-mute hover:text-primary transition-colors"
            >
              查看全部 →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 第四屏：OPC 雷达 ===== */}
      {radarIssue && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-ink mb-8">
              OPC 雷达
            </h2>
            <div className="bg-surface-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-primary font-medium">
                    第 {radarIssue.issueNo} 期
                  </span>
                  <h3 className="text-lg font-semibold text-ink mt-1">
                    {radarIssue.title || `OPC雷达 第${radarIssue.issueNo}期`}
                  </h3>
                </div>
                <span className="text-xs text-ash">
                  {new Date(radarIssue.publishedAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {radarIssue.summary && (
                <p className="text-sm text-mute mb-4 line-clamp-2">{radarIssue.summary}</p>
              )}
              {radarIssue.items.length > 0 && (
                <div className="space-y-2 border-t border-hairline-soft pt-4">
                  {radarIssue.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-body truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-ash">{item.source}</span>
                          {item.city && (
                            <span className="text-xs text-stone">{item.city}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6">
              <Link
                href="/radar"
                className="text-sm text-mute hover:text-primary transition-colors"
              >
                查看全部期刊 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 第五屏：Footer 引导 ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-surface-card rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-ink mb-4">探索更多</h3>
                <div className="space-y-3">
                  <Link
                    href="/news"
                    className="block text-mute hover:text-primary transition-colors"
                  >
                    创业资讯 →
                  </Link>
                  <Link
                    href="/tools"
                    className="block text-mute hover:text-primary transition-colors"
                  >
                    工具导航 →
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink mb-4">
                  你是社区运营方？联系我们
                </h3>
                <p className="text-sm text-mute">微信：opcquan01</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
