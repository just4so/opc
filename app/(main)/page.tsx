import Link from 'next/link'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { Building2, BadgeCheck, Handshake, Heart, MessageCircle } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { AnimatedCounter } from '@/components/ui/animated-counter'

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

const getLatestPosts = unstable_cache(
  async () =>
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        author: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    }),
  ['home-latest-posts'],
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
  const [stats, latestPosts, radarIssue, session] = await Promise.all([
    getHomeStats(),
    getLatestPosts(),
    getLatestRadarIssue(),
    auth(),
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
            <Link
              href={session?.user ? '/settings#card' : '/register'}
              className="btn-press bg-transparent border-[1.5px] border-hairline text-ink rounded-xl px-9 py-3.5 font-semibold hover:bg-surface-soft transition-all"
            >
              让世界看见我
            </Link>
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
                  target={1000}
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

      {/* ===== 最新动态区 ===== */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-ink">最新动态</h2>
            <Link href="/plaza" className="text-sm text-mute hover:text-primary transition-colors">
              查看更多 →
            </Link>
          </div>
        </ScrollReveal>
        {latestPosts.length > 0 ? (
          <ScrollReveal stagger className="space-y-4">
            {latestPosts.map((post) => {
              const preview = post.title || post.content.replace(/[#*`>\-\n]+/g, ' ').trim().slice(0, 80)
              return (
                <Link
                  key={post.id}
                  href={`/plaza/${post.id}`}
                  className="card-interactive p-5 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink line-clamp-1 mb-1.5">
                      {preview}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-mute">
                      <span>{post.author.name || post.author.username}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="flex items-center gap-1 text-primary/70">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.commentCount}
                    </span>
                  </div>
                </Link>
              )
            })}
          </ScrollReveal>
        ) : (
          <div className="text-center py-12">
            <p className="text-mute mb-4">还没有动态，去广场发第一条吧</p>
            <Link
              href="/plaza"
              className="inline-block bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary-pressed transition-colors"
            >
              去广场看看
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
