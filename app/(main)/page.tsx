import Link from 'next/link'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'
import { Building2, BadgeCheck, Handshake, Heart } from 'lucide-react'
import { HeroCardLink } from '@/components/home/session-cta'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { AnimatedCounter } from '@/components/ui/animated-counter'

const COVER_PATTERNS = ['cover-blob', 'cover-rings', 'cover-wave']

function getCoverPattern(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COVER_PATTERNS[Math.abs(hash) % COVER_PATTERNS.length]
}

export const revalidate = 600

export const metadata: Metadata = {
  title: 'OPC创业者，在这里连接、让世界看见',
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

const getHotProducts = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { status: 'PUBLISHED', owner: { showInPlaza: true } },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        images: true,
        logo: true,
        likeCount: true,
        stage: true,
        owner: { select: { name: true, username: true } },
      },
    }),
  ['home-hot-products'],
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
  const [stats, hotProducts, radarIssue] = await Promise.all([
    getHomeStats(),
    getHotProducts(),
    getLatestRadarIssue(),
  ])

  return (
    <div className="flex flex-col">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-canvas py-[120px] px-6">
        <div className="absolute top-[-120px] right-[15%] w-[500px] h-[500px] rounded-full glow-orange" />
        <div className="absolute bottom-[-80px] left-[10%] w-[400px] h-[400px] rounded-full glow-amber" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="relative z-10 max-w-[720px] mx-auto text-center">
          <h1 className="text-[56px] md:text-[68px] font-extrabold tracking-[-2px] leading-[1.08] text-ink mb-5">
            <span className="hero-animate block">OPC创业者，在这里</span>
            <span className="hero-animate hero-delay-1 block gradient-text-orange">连接、让世界看见</span>
          </h1>
          <p className="hero-animate hero-delay-2 text-[17px] text-mute leading-relaxed mb-11 max-w-[480px] mx-auto">
            全国 {stats.total} 个 OPC 社区 · 覆盖 {stats.cityCount} 个城市 · 真实信息人工核实，一键对接入驻
          </p>
          <div className="hero-animate hero-delay-3 flex gap-3 justify-center mb-7">
            <Link
              href="/communities"
              className="btn-press bg-primary text-on-primary rounded-xl px-9 py-3.5 font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_24px_rgba(249,115,22,0.35)] hover:-translate-y-px transition-all"
            >
              找到我的社区
            </Link>
            <HeroCardLink />
          </div>
          <p className="hero-animate hero-delay-4 text-[13px] text-ash">
            不确定？先看看{' '}
            <Link href="/communities" className="text-mute hover:text-ink border-b border-hairline-soft hover:border-ink transition-colors">
              全国 OPC 社区的分布
            </Link>
          </p>
        </div>
      </section>

      {/* ===== 价值区 ===== */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="text-xs font-semibold text-primary uppercase tracking-[1.5px] text-center mb-3">
            为什么选择 OPC圈
          </div>
          <h2 className="text-[32px] font-bold text-ink text-center tracking-[-0.8px] mb-12">
            三个动作，开启创业新阶段
          </h2>
        </ScrollReveal>
        <ScrollReveal stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: `${stats.total} 个社区，帮你对接入驻`,
                desc: `覆盖 ${stats.cityCount} 个城市，真实信息人工核实`,
                href: '/communities',
              },
              {
                icon: BadgeCheck,
                title: '认证创业者，被行业看见',
                desc: '展示你的项目，获得认证标识，进入行业推荐视野',
                href: '/plaza',
              },
              {
                icon: Handshake,
                title: '创业者广场，找到合作',
                desc: '和真实创业者连接，发布需求，找到伙伴',
                href: '/plaza?tab=products',
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="card-interactive bg-canvas p-10 group"
              >
                <card.icon className="h-8 w-8 text-primary mb-5" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-ink mb-2">{card.title}</h3>
                <p className="text-sm text-mute leading-relaxed mb-4">{card.desc}</p>
                <span className="text-sm text-primary font-medium group-hover:underline">
                  了解更多 →
                </span>
              </Link>
            ))}
        </ScrollReveal>
      </section>

      {/* ===== 深色数据区 ===== */}
      <ScrollReveal>
        <div className="h-20 bg-gradient-to-b from-canvas to-surface-dark" />
        <section className="bg-surface-dark py-[80px] px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full glow-orange-subtle" />
          <div className="absolute inset-0 grid-pattern-dark" />
          <div className="relative z-10 max-w-[800px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <AnimatedCounter
                  target={stats.total}
                  className="text-[64px] font-extrabold text-on-dark tracking-[-2px] leading-none block"
                />
                <div className="text-sm text-on-dark-mute mt-2">OPC 社区</div>
              </div>
              <div>
                <AnimatedCounter
                  target={stats.cityCount}
                  className="text-[64px] font-extrabold text-on-dark tracking-[-2px] leading-none block"
                />
                <div className="text-sm text-on-dark-mute mt-2">覆盖城市</div>
              </div>
              <div>
                <AnimatedCounter
                  target={5000}
                  suffix="+"
                  className="text-[64px] font-extrabold text-on-dark tracking-[-2px] leading-none block"
                />
                <div className="text-sm text-on-dark-mute mt-2">创业者</div>
              </div>
            </div>
            <p className="mt-12 text-[15px] text-on-dark-mute text-center">
              每一条社区信息都经过人工核实，不是爬虫，不是复制粘贴
            </p>
          </div>
        </section>
        <div className="h-20 bg-gradient-to-b from-surface-dark to-canvas" />
      </ScrollReveal>

      {/* ===== 热门产品横版滚动 ===== */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-ink">热门产品</h2>
            <Link href="/plaza?tab=products" className="text-sm text-mute hover:text-primary transition-colors">
              查看全部 →
            </Link>
          </div>
        </ScrollReveal>
        {hotProducts.length > 0 ? (
          <div className="overflow-x-auto flex gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {hotProducts.map((product) => (
              <Link
                key={product.id}
                href={`/projects/${product.slug}`}
                className="min-w-[280px] max-w-[280px] snap-start rounded-2xl bg-canvas border border-hairline-soft hover:shadow-sm transition-shadow flex flex-col overflow-hidden"
              >
                <div className="h-36 relative">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full cover-fallback ${getCoverPattern(product.name)} px-4`}>
                      <span className="font-bold text-[#1e293b] text-center leading-tight relative z-[2]" style={{ fontSize: product.name.length > 8 ? '14px' : '18px' }}>
                        {product.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-ink mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-mute line-clamp-2 mb-3 flex-1">
                    {product.description || '暂无介绍'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ash">
                    <span className="flex items-center gap-1 text-primary/70">
                      <Heart className="h-3.5 w-3.5" />
                      {product.likeCount}
                    </span>
                    <span>{product.owner.name || product.owner.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-mute mb-4">还没有产品，去直通车发布你的第一个产品吧</p>
            <Link
              href="/connect"
              className="inline-block bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary-pressed transition-colors"
            >
              发布产品
            </Link>
          </div>
        )}
      </section>

      {/* ===== 雷达区 ===== */}
      {radarIssue && (
        <ScrollReveal>
          <section className="pb-20 px-6 max-w-[1100px] mx-auto">
            <div className="flex justify-between items-baseline mb-8">
              <h2 className="text-2xl font-bold text-ink">OPC 雷达</h2>
              <Link href="/radar" className="text-sm text-mute hover:text-primary transition-colors">
                全部期刊 →
              </Link>
            </div>
            <div className="card-interactive p-8">
              <div className="flex justify-between mb-4">
                <div>
                  <span className="text-xs text-primary font-semibold">
                    第 {radarIssue.issueNo} 期
                  </span>
                  <h3 className="text-[17px] font-semibold text-ink mt-1">
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
                <p className="text-sm text-mute leading-relaxed mb-4">{radarIssue.summary}</p>
              )}
              {radarIssue.items.length > 0 && (
                <div className="space-y-3 border-t border-hairline-soft pt-4">
                  {radarIssue.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="w-[5px] h-[5px] rounded-full bg-primary mt-[7px] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-body">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-ash">{item.source}</span>
                          {item.city && (
                            <span className="text-xs text-ash">{item.city}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}
    </div>
  )
}
