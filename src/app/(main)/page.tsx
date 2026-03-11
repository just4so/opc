import Link from 'next/link'
import { MapPin, MessageSquare, Handshake, Cpu, ArrowRight } from 'lucide-react'
import { NewsCardCompact } from '@/components/news/news-card'
import { ActivityBar } from '@/components/home/activity-bar'
import { HeroSessionLink, CtaSessionLink } from '@/components/home/session-cta'
import prisma from '@/lib/db'

export const revalidate = 60

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
      }),
    ]).then(([total, cities]) => ({
      totalCommunities: total,
      totalCities: cities.length,
    })),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        author: { select: { name: true, username: true } },
      },
    }),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-subtle overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 leading-tight">
            让 AI 创业者
            <br />
            <span className="text-gradient">不再孤独前行</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            全国 {statsResult.totalCommunities > 0 ? `${statsResult.totalCommunities}+` : '120+'} 个 OPC 社区攻略 · 真实入驻者说 · 少走弯路
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all"
            >
              探索社区
              <ArrowRight className="h-4 w-4" />
            </Link>
            <HeroSessionLink />
          </div>
        </div>
      </section>

      {/* 实时动态条 */}
      <ActivityBar initialPosts={recentPosts} />

      {/* 统计数据 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: statsResult.totalCities > 0 ? `${statsResult.totalCities}+` : '--', label: '覆盖城市' },
              { value: statsResult.totalCommunities > 0 ? `${statsResult.totalCommunities}+` : '--', label: 'OPC 社区' },
              { value: '多城市', label: '免租工位' },
              { value: '3年', label: '最长免租期' },
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {item.value}
                </div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 真实案例 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              真实创业者在做什么
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tag: 'AI工具开发·深圳',
                title: '非程序员用AI 1小时做出App，霸榜App Store付费总榜第1',
                stats: [
                  { label: '启动成本', value: '几乎为零' },
                  { label: '核心工具', value: 'AI辅助开发' },
                ],
              },
              {
                tag: '跨境电商·深圳',
                title: '1人管3个独立站，月均净利40%+',
                stats: [
                  { label: '工具成本', value: '7000元/月' },
                  { label: '核心工具', value: 'AI选品+自动化' },
                ],
              },
              {
                tag: 'AI内容服务·苏州',
                title: '月产100篇内容，3个固定客户',
                stats: [
                  { label: '工具成本', value: '1800元/月' },
                  { label: '核心工具', value: 'Claude+Canva' },
                ],
              },
            ].map((card, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft p-6 flex flex-col">
                <span className="inline-block self-start px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 mb-4">
                  {card.tag}
                </span>
                <h3 className="text-lg font-semibold text-secondary mb-4 leading-snug">
                  {card.title}
                </h3>
                <div className="space-y-2 mb-6 flex-1">
                  {card.stats.map((stat, i) => (
                    <div key={i} className="flex items-center text-sm text-gray-600">
                      <span className="text-gray-400 mr-2">{stat.label}：</span>
                      <span className="font-medium text-secondary">{stat.value}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/plaza"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  → 查看完整路径
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            数据来源：公开报道 · 2026年3月整理
          </p>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              为创业者而生
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              无论你是独立开发者、自由职业者还是小团队，这里都有你需要的资源
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: '社区地图',
                desc: '发现身边的创业空间',
                href: '/communities',
                color: 'text-primary bg-primary-50',
              },
              {
                icon: MessageSquare,
                title: '创业广场',
                desc: '分享想法，碰撞灵感',
                href: '/plaza',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Handshake,
                title: '合作广场',
                desc: '技能互补，资源共享',
                href: '/market',
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                icon: Cpu,
                title: '工具导航',
                desc: '低成本接入 AI 能力',
                href: '/tools',
                color: 'text-purple-600 bg-purple-50',
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group p-6 rounded-xl bg-white shadow-soft hover:shadow-soft-lg card-hover"
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 热门城市 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              热门城市
            </h2>
            <p className="text-gray-500">
              选择城市，探索当地的 OPC 创业社区
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['深圳', '杭州', '北京', '上海', '苏州', '常州', '无锡', '成都'].map((city) => (
              <Link
                key={city}
                href={`/communities?city=${city}`}
                className="group p-5 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors text-center"
              >
                <div className="text-lg font-medium text-secondary group-hover:text-primary transition-colors">
                  {city}
                </div>
                <div className="text-xs text-gray-400 mt-1 group-hover:text-primary-400">
                  查看社区 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 创业资讯 */}
      {newsItems.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-secondary">
                创业资讯
              </h2>
              <Link
                href="/news"
                className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                查看更多
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-soft divide-y divide-gray-100">
              {newsItems.map((item) => (
                <NewsCardCompact key={item.id} news={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            开启你的创业之旅
          </h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">
            加入 OPC 创业圈，与志同道合的创业者一起成长
          </p>
          <CtaSessionLink />
        </div>
      </section>
    </div>
  )
}
