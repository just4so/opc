import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/db'
import { WeChatButton } from '@/components/about/wechat-button'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '关于 OPC圈 | 一城一人，连接信任',
  description: 'OPC圈是中国一人公司创业者的信息与连接平台。人工核实每一条社区信息，在每座城市寻找一位值得信任的城市主理人。',
}

export default async function AboutPage() {
  const managers = await prisma.cityManager.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ order: 'desc' }, { createdAt: 'asc' }],
  })

  const hasManagers = managers.length > 0
  const bigCards = managers.slice(0, 2)
  const smallCards = managers.slice(2)

  return (
    <div className="min-h-screen bg-background">

      {/* Section 1: Brand Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative container mx-auto px-4 py-28 max-w-4xl text-center">
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase mb-8">One Person Company</p>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            <span className="block">一城一人，</span>
            <em className="block text-primary not-italic">连接信任。</em>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            OPC圈是中国一人公司创业者的信息与连接平台。我们人工核实每一条社区信息，
            在每座城市寻找一位值得信任的主理人——因为信息可以很多，但信任永远稀缺。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              找到我的社区
            </Link>
            <Link
              href="/plaza"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors active:scale-[0.98]"
            >
              去广场看看
            </Link>
          </div>

          <p className="mt-16 text-slate-500 text-sm tracking-widest">EST. 2025 · 北京数据胶囊科技</p>
        </div>
      </section>

      {/* Section 2: 我们是谁 / 我们做什么 */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">我们是谁</h2>
            <p className="text-mute text-lg max-w-2xl mx-auto leading-relaxed">
              OPC圈是中国最真最全的一人公司社区信息平台。
              联合创业者共创内容，帮助每一位 OPC 创业者找到适合自己的社区，同时被行业看见。
            </p>
            <p className="text-ash text-sm mt-3">OPC圈由北京数据胶囊科技有限公司运营。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                emoji: '🏢',
                title: '社区信息',
                desc: '收录全国 180+ 个 OPC 社区，覆盖 60+ 个城市。每个社区的入驻费用、政策福利、配套设施均经人工核实，拒绝虚假信息。',
              },
              {
                emoji: '🟢',
                title: '社区直通车',
                desc: '一键提交入驻意向，由 OPC圈 审核后直接推荐给社区。省去自己一家家打电话的麻烦。',
              },
              {
                emoji: '🤝',
                title: '创业者广场',
                desc: '展示你自己和你的产品，找到合作伙伴和客户。不是冷冰冰的名片墙，而是有动态、有互动的创业者社区。',
              },
              {
                emoji: '📡',
                title: 'OPC 雷达',
                desc: '每日追踪全国 OPC 政策动态、行业新闻、融资消息，帮你掌握一手信息。',
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-surface-card border border-hairline rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="font-semibold text-ink text-lg mb-2">{item.title}</h3>
                <p className="text-mute leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 + 4: City Managers (only when ACTIVE managers exist) */}
      {hasManagers && (
        <>
          <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-16">
                <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">City Managers</p>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4">城市主理人</h2>
                <p className="text-slate-400 text-lg">每座城市，只有一位。</p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-12 gap-4 md:gap-6">
                {/* Big cards (first 2) */}
                {bigCards.map(m => (
                  <div
                    key={m.id}
                    className="col-span-12 md:col-span-6 bg-slate-800 rounded-[32px] overflow-hidden border border-slate-700/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  >
                    {/* Photo area */}
                    <div className="relative h-56 bg-slate-700">
                      {m.avatar ? (
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                          </svg>
                        </div>
                      )}
                      {/* City tag overlay */}
                      <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                        <span className="bg-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {m.scope === 'PROVINCE' ? m.province : `${m.city}·${m.province}`}
                        </span>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">{m.name}</h3>
                        {m.title && <p className="text-slate-400 text-sm mt-0.5">{m.title}</p>}
                      </div>

                      {m.quote && (
                        <blockquote className="border-l-2 border-primary pl-3 text-slate-300 text-sm italic leading-relaxed">
                          「{m.quote}」
                        </blockquote>
                      )}

                      {m.focusTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.focusTags.map(tag => (
                            <span key={tag} className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {m.wechat && (
                        <div className="pt-1">
                          <WeChatButton wechat={m.wechat} name={m.name} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Small cards (rest) */}
                {smallCards.map(m => (
                  <div
                    key={m.id}
                    className="col-span-12 sm:col-span-6 lg:col-span-4 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-primary/40 transition-all duration-300 p-5 space-y-3 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                        {m.avatar ? (
                          <Image
                            src={m.avatar}
                            alt={m.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg font-bold">
                            {m.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{m.name}</h3>
                        <span className="text-xs text-primary font-medium">
                          {m.scope === 'PROVINCE' ? m.province : m.city}
                        </span>
                      </div>
                    </div>

                    {m.title && <p className="text-slate-400 text-sm">{m.title}</p>}

                    {m.bio && (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{m.bio}</p>
                    )}

                    {m.focusTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.focusTags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {m.wechat && (
                      <WeChatButton wechat={m.wechat} name={m.name} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: CTA */}
          <section className="py-20 bg-slate-950">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                成为下一座城市的主理人
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                OPC圈正在全国范围内寻找城市主理人。一城一人，排他制。
                你将获得官方背书、品牌曝光与本城 OPC 社群的连接资源。
              </p>
              <a
                href="mailto:cooperation@opcquan.com?subject=申请城市主理人（填写你的城市）"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
              >
                发邮件申请
              </a>
            </div>
          </section>
        </>
      )}

      {/* Section 5: 联系我们 */}
      <section className="py-24 bg-background border-t border-hairline">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8">联系我们</h2>
          <div className="space-y-4 text-mute">
            <p>
              商务合作：
              <a href="mailto:cooperation@opcquan.com" className="text-primary hover:underline">
                cooperation@opcquan.com
              </a>
            </p>
            <p>社区收录/纠错：在任意社区详情页底部点击「我是该社区运营方」或「提交社区收录」</p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              找到我的社区
            </Link>
            <Link
              href="/plaza"
              className="inline-flex items-center justify-center rounded-2xl border border-hairline px-6 py-3 font-medium text-ink hover:bg-surface-soft transition-colors active:scale-[0.98]"
            >
              去广场看看
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
