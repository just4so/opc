import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { ArrowRight, MapPin, Users, Sparkles, Package } from 'lucide-react'
import { CommunityCover } from '@/components/welcome/community-cover'

const TRACK_KEYWORDS: Record<string, string[]> = {
  ai_saas: ['人工智能', 'AI应用', 'AI', 'AIGC', '大模型应用', 'LLM应用', 'AI工具开发'],
  design: ['数字文创', '内容创作', '数字内容', '创意设计'],
  consulting: ['知识产权', '企业软件', '超级个体', '咨询'],
  ecommerce: ['跨境电商', '电商', '直播电商'],
  content: ['内容创作', '数字内容', 'AIGC', '自媒体'],
  dev: ['AI应用开发', 'AI工具开发', 'LLM应用', '独立开发'],
}

const COVER_GRADIENTS = [
  { from: '#FFF3ED', to: '#FDEBD0', text: '#F97316' },
  { from: '#EEF2FF', to: '#DDE7FF', text: '#4F46E5' },
  { from: '#F0FDF4', to: '#DCFCE7', text: '#16A34A' },
  { from: '#FEF3C7', to: '#FDE68A', text: '#D97706' },
  { from: '#FDF2F8', to: '#FCE7F3', text: '#DB2777' },
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length]
}

export default async function WelcomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, mainTracks: true },
  })

  const keywords = (user?.mainTracks ?? []).flatMap(t => TRACK_KEYWORDS[t] ?? [])

  let communities = keywords.length > 0
    ? await prisma.community.findMany({
        where: { status: 'ACTIVE', focusTracks: { hasSome: keywords } },
        select: { slug: true, name: true, city: true, district: true, coverImage: true, focusTracks: true },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      })
    : []

  if (communities.length < 3) {
    const fillerSlugs = communities.map(c => c.slug)
    const filler = await prisma.community.findMany({
      where: { status: 'ACTIVE', featured: true, slug: { notIn: fillerSlugs } },
      select: { slug: true, name: true, city: true, district: true, coverImage: true, focusTracks: true },
      orderBy: { createdAt: 'desc' },
      take: 3 - communities.length,
    })
    communities = [...communities, ...filler]
  }

  const products = await prisma.project.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, name: true, logo: true, coverImage: true, tagline: true, description: true, category: true, likeCount: true },
    orderBy: { likeCount: 'desc' },
    take: 4,
  })

  const displayName = user?.name?.split(' ')[0] || '创业者'
  const hasTrack = (user?.mainTracks?.length ?? 0) > 0

  return (
    <div className="min-h-screen bg-[#fbfbf9] overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative pt-20 pb-16 px-6">
        {/* 背景光晕 — 多层 */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/6 blur-[180px]" />
        <div className="pointer-events-none absolute top-20 left-1/4 w-[400px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute top-10 right-1/4 w-[300px] h-[250px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 max-w-[680px] mx-auto text-center">
          {/* 欢迎徽章 */}
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-8 hero-animate">
            <Sparkles size={12} />
            注册成功，欢迎加入 OPC圈
          </div>

          <h1 className="hero-animate hero-delay-1 text-[40px] md:text-[56px] font-black tracking-tight text-ink leading-[1.05] mb-5">
            你好，<span className="text-primary">{displayName}</span> 👋
          </h1>
          <p className="hero-animate hero-delay-2 text-[15px] md:text-[17px] text-mute leading-[1.7] max-w-[440px] mx-auto">
            {hasTrack
              ? '根据你的创业方向，我们为你精选了适合的社区和产品'
              : '这里是全国 OPC 创业者的聚集地，探索你感兴趣的内容'}
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 pb-24 space-y-16">

        {/* ── 推荐社区 ── */}
        <section className="hero-animate hero-delay-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-primary mb-1">
                {hasTrack ? '为你推荐' : '热门社区'}
              </p>
              <h2 className="text-[22px] font-bold text-ink">找到你的 OPC 社区</h2>
            </div>
            <Link
              href="/communities"
              className="flex items-center gap-1 text-sm text-mute hover:text-primary transition-colors"
            >
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {communities.map((c, i) => {
              const grad = getGradient(c.name)
              return (
                <Link
                  key={c.slug}
                  href={`/communities/${c.slug}`}
                  className="group bg-white border border-hairline-soft rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-200"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* 封面 */}
                  {c.coverImage ? (
                    <CommunityCover
                      src={c.coverImage}
                      alt={c.name}
                      fallbackText={c.name[0]}
                      gradFrom={grad.from}
                      gradTo={grad.to}
                      gradColor={grad.text}
                    />
                  ) : (
                    <div
                      className="h-40 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                    >
                      <span className="text-4xl font-extrabold" style={{ color: grad.text }}>{c.name[0]}</span>
                    </div>
                  )}
                  {/* 信息 */}
                  <div className="p-5">
                    <p className="font-bold text-ink text-[15px] truncate leading-snug">{c.name}</p>
                    <p className="flex items-center gap-1 text-xs text-mute mt-1.5">
                      <MapPin size={11} className="shrink-0" />
                      {c.city}{c.district ? ` · ${c.district}` : ''}
                    </p>
                    {c.focusTracks[0] && (
                      <span className="inline-block mt-3 bg-primary/8 text-primary text-[11px] font-medium rounded-full px-2.5 py-0.5">
                        {c.focusTracks[0]}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── 最新产品 ── */}
        {products.length > 0 && (
          <section className="hero-animate hero-delay-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-primary mb-1">创业者在做什么</p>
                <h2 className="text-[22px] font-bold text-ink">最新产品</h2>
              </div>
              <Link
                href="/plaza?tab=products"
                className="flex items-center gap-1 text-sm text-mute hover:text-primary transition-colors"
              >
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p, i) => {
                const grad = getGradient(p.name)
                const desc = p.tagline || p.description?.replace(/<[^>]+>/g, '').slice(0, 60) || ''
                return (
                  <Link
                    key={p.slug}
                    href={`/projects/${p.slug}`}
                    className="group bg-white border border-hairline-soft rounded-2xl p-5 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-200"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shrink-0">
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                        >
                          <span className="text-2xl font-extrabold" style={{ color: grad.text }}>{p.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-ink text-[15px] truncate">{p.name}</p>
                    {desc && (
                      <p className="text-[13px] text-mute mt-1.5 line-clamp-2 leading-relaxed">{desc}</p>
                    )}
                    {p.category[0] && (
                      <span className="inline-block mt-3 bg-surface-card text-mute text-[12px] rounded-full px-2.5 py-0.5">
                        {p.category[0]}
                      </span>
                    )}
                    {p.likeCount > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-[12px] text-mute">
                        <span>❤</span>
                        <span>{p.likeCount}</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 快捷入口 ── */}
        <section className="hero-animate hero-delay-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/plaza"
              className="group relative bg-white border border-hairline-soft rounded-2xl p-6 overflow-hidden hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(249,115,22,0.08)] transition-all duration-200"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                <Users size={22} className="text-primary" />
              </div>
              <p className="font-bold text-ink text-[15px]">创业广场</p>
              <p className="text-[13px] text-mute mt-1.5">看看大家在做什么</p>
            </Link>
            <Link
              href="/communities"
              className="group relative bg-white border border-hairline-soft rounded-2xl p-6 overflow-hidden hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(249,115,22,0.06)] transition-all duration-200"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                <MapPin size={22} className="text-primary" />
              </div>
              <p className="font-bold text-ink text-[15px]">找社区</p>
              <p className="text-[13px] text-mute mt-1.5">全国 OPC 社区</p>
            </Link>
            <Link
              href="/settings#products"
              className="group relative bg-white border border-hairline-soft rounded-2xl p-6 overflow-hidden hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(249,115,22,0.06)] transition-all duration-200"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                <Package size={22} className="text-primary" />
              </div>
              <p className="font-bold text-ink text-[15px]">发布你的产品</p>
              <p className="text-[13px] text-mute mt-1.5">让1000+创业者看见你在做什么</p>
            </Link>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="hero-animate hero-delay-4 text-center pt-4">
          <p className="text-sm text-mute mb-5">你的 OPC 之旅从这里开始</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 btn-press bg-primary text-white rounded-2xl px-12 py-4.5 font-bold text-[17px] shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.4)] hover:bg-primary/90 transition-all duration-200"
          >
            开始探索 OPC圈
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>
    </div>
  )
}
