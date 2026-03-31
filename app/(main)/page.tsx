import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, MessageSquare, Cpu, ArrowRight, BookOpen, Gift, CheckCircle2, Users } from 'lucide-react'
import { NewsCardCompact } from '@/components/news/news-card'
import { ActivityBar } from '@/components/home/activity-bar'
import { HeroSessionLink, CtaSessionLink } from '@/components/home/session-cta'
import prisma from '@/lib/db'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'OPC圈 · 一人公司，不必一个人摸索',
  description: '最真最全的一人公司社区信息。人工核实 + 创业者共创，覆盖全国29城104个OPC社区攻略、真实入驻评价，不定期福利资源。',
}

export default async function HomePage() {
  const [newsItems, statsResult, recentPosts] = await Promise.all([
    prisma.news.findMany({
      orderBy: [{ isOriginal: 'desc' }, { publishedAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        summary: true,
        url: true,
        source: true,
        category: true,
        coverImage: true,
        publishedAt: true,
        isOriginal: true,
        author: true,
      },
    }),
    Promise.all([
      prisma.community.count({ where: { status: 'ACTIVE' } }),
      prisma.community.groupBy({
        by: ['city'],
        where: { status: 'ACTIVE' },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
      }),
    ]).then(([total, cities]) => ({
      totalCommunities: total,
      totalCities: cities.length,
      topCities: cities
        .sort((a, b) => (b._count as number) - (a._count as number))
        .slice(0, 8)
        .map(c => ({ name: c.city, count: c._count as number })),
    })),
    prisma.post.findMany({
      take: 5,
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
      },
    }),
  ])

  return (
    <div className="flex flex-col">

      {/* ===== Hero ===== */}
      <section className="relative py-28 px-4 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* 装饰光晕 */}
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[300px] h-[300px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* 顶部 badge */}
        <div className="flex justify-center mb-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {statsResult.totalCommunities}+ 个OPC社区持续更新中
          </span>
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-secondary mb-6 leading-[1.15] tracking-tight">
            一个人创业
            <br />
            <span className="text-gradient">不必一个人摸索</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-4 max-w-2xl mx-auto leading-relaxed">
            OPC圈 — 最真、最全的一人公司社区信息
          </p>
          <p className="text-sm md:text-base text-gray-400 mb-10 max-w-xl mx-auto">
            人工核实 + 创业者共创 · 真实入驻评价 · 不定期福利资源
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white hover:bg-primary-600 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              <MapPin className="h-4 w-4" />
              探索社区地图
            </Link>
            <Link
              href="/plaza"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-secondary border border-gray-200 hover:border-primary/40 hover:text-primary shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-0.5"
            >
              <MessageSquare className="h-4 w-4" />
              进入交流广场
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-secondary shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-0.5"
            >
              <BookOpen className="h-4 w-4" />
              一人公司入门
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 实时动态条 ===== */}
      <ActivityBar initialPosts={recentPosts} />

      {/* ===== 价值锚点 3格 ===== */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                icon: CheckCircle2,
                iconColor: 'text-primary',
                bgColor: 'bg-primary/8',
                title: '最真最全的社区信息',
                desc: '人工核实 + 创业者共创持续补充，真实政策、真实评价，不注水不广告',
              },
              {
                icon: Users,
                iconColor: 'text-blue-500',
                bgColor: 'bg-blue-50',
                title: '真实入驻者共建',
                desc: `覆盖全国 ${statsResult.totalCities} 个城市、${statsResult.totalCommunities}+ 个OPC社区，亲身入驻经历持续沉淀`,
              },
              {
                icon: Gift,
                iconColor: 'text-amber-500',
                bgColor: 'bg-amber-50',
                title: '不定期福利资源',
                desc: '优质资源定向向圈内发放，包括政策红利、工具资源、社区优惠等',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 px-8 py-8">
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-secondary mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                value: statsResult.totalCommunities > 0 ? `${statsResult.totalCommunities}+` : '104+',
                label: 'OPC 社区',
                sub: '持续收录中',
                highlight: true,
              },
              {
                value: statsResult.totalCities > 0 ? `${statsResult.totalCities}` : '29',
                label: '覆盖城市',
                sub: '全国持续扩展',
                highlight: false,
              },
              {
                value: '人工核实',
                label: '每条信息',
                sub: '+ 创业者共创补充',
                highlight: false,
              },
              {
                value: '不定期',
                label: '福利资源',
                sub: '向圈内成员发放',
                highlight: false,
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`text-center p-6 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  item.highlight
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white border-gray-100 shadow-soft'
                }`}
              >
                <div className={`text-2xl md:text-3xl font-bold mb-1 ${item.highlight ? 'text-white' : 'text-primary'}`}>
                  {item.value}
                </div>
                <div className={`text-sm font-medium mb-0.5 ${item.highlight ? 'text-white/90' : 'text-secondary'}`}>
                  {item.label}
                </div>
                <div className={`text-xs ${item.highlight ? 'text-white/70' : 'text-gray-400'}`}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 核心功能 4张卡 ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-secondary mb-3">
              OPC圈能帮你做什么
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              从找社区到聊创业，从入门到工具，一站搞定
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: MapPin,
                title: '社区地图',
                desc: '全国OPC社区 · 真实政策 · 入驻攻略一网打尽',
                href: '/communities',
                iconColor: 'text-primary',
                bgColor: 'bg-primary/8',
                borderHover: 'hover:border-primary/30',
                tag: `${statsResult.totalCommunities}+ 个社区`,
              },
              {
                icon: MessageSquare,
                title: '交流广场',
                desc: '和真实创业者聊聊、求助、分享经验',
                href: '/plaza',
                iconColor: 'text-blue-500',
                bgColor: 'bg-blue-50',
                borderHover: 'hover:border-blue-200',
                tag: '真实创业者',
              },
              {
                icon: BookOpen,
                title: '入门指南',
                desc: '不知道怎么开始？大厂出走 · 应届生 · 自由职业者的路径',
                href: '/start',
                iconColor: 'text-green-500',
                bgColor: 'bg-green-50',
                borderHover: 'hover:border-green-200',
                tag: '从零出发',
              },
              {
                icon: Cpu,
                title: 'AI工具导航',
                desc: '精选低成本AI工具，一人公司降本增效必备',
                href: '/tools',
                iconColor: 'text-purple-500',
                bgColor: 'bg-purple-50',
                borderHover: 'hover:border-purple-200',
                tag: '低成本提效',
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`group p-6 rounded-2xl bg-white border border-gray-100 shadow-soft ${item.borderHover} hover:shadow-md transition-all hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center mb-5`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.bgColor} ${item.iconColor}`}>
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${item.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  进入
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 广场动态 ===== */}
      {recentPosts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-secondary mb-2">
                  创业者在聊什么
                </h2>
                <p className="text-gray-400 text-sm">来自真实创业者的声音</p>
              </div>
              <Link
                href="/plaza"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-primary transition-colors"
              >
                进入广场
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {recentPosts.slice(0, 3).map((post) => {
                const typeMap: Record<string, { label: string; color: string; dot: string }> = {
                  CHAT: { label: '聊聊', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
                  HELP: { label: '求助', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
                  SHARE: { label: '分享', color: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
                  COLLAB: { label: '找人', color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-400' },
                }
                const typeInfo = typeMap[post.type] ?? { label: post.type, color: 'bg-gray-50 text-gray-500', dot: 'bg-gray-400' }
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(post.createdAt).getTime()
                  const h = Math.floor(diff / 3600000)
                  const d = Math.floor(diff / 86400000)
                  if (h < 1) return '刚刚'
                  if (h < 24) return `${h}小时前`
                  return `${d}天前`
                })()
                return (
                  <Link
                    key={post.id}
                    href={`/plaza/${post.id}`}
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:border-primary/20 hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${typeInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeInfo.dot}`} />
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-gray-300">{timeAgo}</span>
                    </div>
                    {post.title && (
                      <p className="text-sm font-semibold text-secondary mb-2 line-clamp-1">{post.title}</p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed mb-5 flex-1 line-clamp-4">
                      {post.content.split('\n')[0].slice(0, 120)}
                      {post.content.length > 120 ? '…' : ''}
                    </p>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                      <span className="text-xs text-gray-400">
                        {post.author.name || post.author.username || '匿名创业者'}
                      </span>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        查看全文 <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link
                href="/plaza"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
              >
                进入交流广场
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 热门城市 ===== */}
      {statsResult.topCities.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary mb-3">
                选城市，找社区
              </h2>
              <p className="text-gray-400 text-sm">
                覆盖全国 {statsResult.totalCities} 个城市，持续扩展中
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statsResult.topCities.map((city) => (
                <Link
                  key={city.name}
                  href={`/communities?city=${city.name}`}
                  className="group relative p-5 rounded-2xl bg-gray-50 border border-transparent hover:bg-primary-50 hover:border-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-lg font-semibold text-secondary group-hover:text-primary transition-colors mb-1">
                      {city.name}
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-primary/70 transition-colors">
                      {city.count} 个社区
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/communities"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary transition-colors"
              >
                查看全部城市
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 创业资讯 ===== */}
      {newsItems.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-1">创业资讯</h2>
                <p className="text-sm text-gray-400">OPC政策 · 行业动态 · 原创内容</p>
              </div>
              <Link
                href="/news"
                className="text-sm font-medium text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
              >
                查看更多
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft divide-y divide-gray-50 overflow-hidden">
              {newsItems.map((item) => (
                <NewsCardCompact key={item.id} news={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-secondary/90 relative overflow-hidden">
        {/* 装饰 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm mb-8 border border-white/10">
            <Gift className="h-4 w-4" />
            注册即有机会获得福利资源
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            加入OPC圈
          </h2>
          <p className="text-gray-300 mb-2 text-lg max-w-md mx-auto">
            人工核实的真实信息，志同道合的同行者
          </p>
          <p className="text-gray-400 mb-10 text-sm">
            一人公司，从这里少走弯路
          </p>
          <CtaSessionLink />
        </div>
      </section>

    </div>
  )
}
