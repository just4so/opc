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

const stats = [
  { number: '400+', label: '线下OPC社区', hint: '不用自己一家家打听' },
  { number: '70+', label: '覆盖城市', hint: '无论你在哪，大概率有' },
  { number: '5000+', label: '活跃创业者', hint: '找搭档、找客户、找共鸣' },
  { number: '1000万+', label: '全网内容触达', hint: '你的城市故事有人在看' },
]

const features = [
  {
    num: '01',
    title: '找到适合你的社区',
    desc: '不知道去哪创业？400+ 社区按城市、价格、政策一目了然。每条信息人工核实，不靠爬虫。',
  },
  {
    num: '02',
    title: '看懂行业政策',
    desc: 'OPC圈持续追踪全国政策动态，已出版两份权威研究报告，与多家主流媒体建立长期合作关系。',
  },
  {
    num: '03',
    title: '让世界看见你',
    desc: '一个人创业容易孤独。创业者广场让你展示自己和产品，找到同路人、搭档和客户。',
  },
]

export default async function AboutPage() {
  const managers = await prisma.cityManager.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ order: 'desc' }, { createdAt: 'asc' }],
  })

  const hasManagers = managers.length > 0
  const bigCards = managers.slice(0, 2)
  const smallCards = managers.slice(2)

  return (
    <div className="min-h-screen bg-[#FBFBF9]">

      {/* Section 1: Brand Hero */}
      <section className="bg-[#FBFBF9]">
        <div className="max-w-[1280px] mx-auto px-8 pt-24 pb-16 border-b-4 border-slate-900">
          <div className="flex flex-col md:flex-row md:items-end gap-12 md:gap-16">
            <div className="flex-1 min-w-0">
              <h1 style={{ fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 1, fontWeight: 900, letterSpacing: '-0.03em' }}>
                <span className="block text-slate-900">一城一人，</span>
                <span className="block text-primary italic">连接信任。</span>
              </h1>
            </div>
            <div className="md:w-[420px] flex-shrink-0">
              <p className="text-slate-600 text-base leading-relaxed">
                OPC圈是国内领先的一人公司垂直社区平台。
                我们连接 OPC 创业者、线下社区与产业资源，
                在每座城市寻找一位值得信任的主理人。
              </p>
              <div className="flex items-center gap-4 mt-6">
                <div className="w-12 h-[2px] bg-primary flex-shrink-0" />
                <span className="text-xs tracking-widest text-primary font-semibold">
                  EST. 2025 · 北京数据胶囊科技
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Stats */}
      <section className="bg-[#FBFBF9] border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200">
            {stats.map(s => (
              <div key={s.label} className="bg-[#FBFBF9] p-10">
                <div className="text-5xl md:text-6xl font-black text-slate-900">{s.number}</div>
                <div className="text-sm font-semibold text-slate-700 mt-2">{s.label}</div>
                <div className="text-xs text-slate-400 mt-1">{s.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Narrative */}
      <section className="bg-[#FBFBF9]">
        <div className="max-w-[1280px] mx-auto px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left 4 cols */}
            <div className="md:col-span-4">
              <span className="border-l-2 border-primary pl-4 text-primary text-xs tracking-widest font-semibold">
                我们为什么做这件事
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-6 leading-snug">
                因为这个行业，值得被认真对待。
              </h2>
            </div>

            {/* Right 8 cols */}
            <div className="md:col-span-8 space-y-6">
              <div className="bg-[#F6F6F3] rounded-2xl border border-slate-200 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-orange-100 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
                <div className="text-base leading-relaxed text-slate-700 relative z-10 space-y-4">
                  <p>2023年，一人公司在中国开始爆发。政策在变，社区在涌现，但没有人把这些事情讲清楚。</p>
                  <p>没有人告诉你：北京哪个社区真的给补贴，深圳哪个社区适合做跨境，武汉的政策窗口什么时候关。</p>
                  <p>OPC圈就是为了解决这个问题存在的。我们人工核实每一条信息，不靠爬虫，不靠转载。已经发布两份行业研究报告，与多家主流媒体长期合作——因为这个行业值得被认真对待。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map(f => (
                  <div
                    key={f.title}
                    className="bg-white border-l-4 border-primary border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-2xl font-black text-primary mb-3">{f.num}</div>
                    <h3 className="font-semibold text-slate-900 text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 + 5: City Managers + CTA (conditional) */}
      {hasManagers && (
        <>
          {/* Dark Bento */}
          <div className="bg-[#1a1c1b] rounded-[32px] mx-4 md:mx-8 mb-24 py-24 px-8 md:px-16 overflow-hidden relative">
            {/* Dot grid background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Header */}
            <div className="mb-16 relative z-10">
              <h2
                style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}
                className="text-[#FBFBF9]"
              >
                城市主理人
              </h2>
              <em className="text-primary not-italic block"
                style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                一城，一位。
              </em>
              <p className="text-slate-400 max-w-lg mt-4 text-base leading-relaxed">
                不是平台客服，不是中间商。主理人是在这座城市真实创业的人，他们愿意用自己的信用，帮你少走弯路。
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-6 relative z-10">
              {/* Big cards (first 2) */}
              {bigCards.map((m, i) => {
                const isFirst = i === 0
                const cityLabel = m.city || m.province
                return (
                  <div
                    key={m.id}
                    className={`col-span-12 ${isFirst ? 'md:col-span-7' : 'md:col-span-5'} rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 p-1 group hover:border-primary/40 transition-all`}
                  >
                    <div className="flex flex-col md:flex-row h-full min-h-[280px]">
                      {isFirst ? (
                        <>
                          {/* Image left */}
                          <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden rounded-xl flex-shrink-0">
                            {m.avatar ? (
                              <Image
                                src={m.avatar}
                                alt={m.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-slate-700 text-white font-bold text-5xl">
                                {m.name[0]}
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest shadow-lg">
                                {cityLabel}
                              </span>
                            </div>
                          </div>
                          {/* Content right */}
                          <div className="p-6 md:w-1/2 flex flex-col justify-center gap-4">
                            <h4 className="text-xl font-bold text-[#FBFBF9]">{m.name}</h4>
                            {m.title && (
                              <p className="text-sm text-slate-400 mt-0.5">{m.title}</p>
                            )}
                            {m.quote && (
                              <p className="text-sm text-slate-300 italic leading-relaxed">「{m.quote}」</p>
                            )}
                            {m.focusTags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {m.focusTags.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {m.wechat && <WeChatButton wechat={m.wechat} name={m.name} />}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Content left — left-aligned */}
                          <div className="p-6 md:w-1/2 flex flex-col justify-center gap-4 order-2 md:order-1">
                            <h4 className="text-xl font-bold text-[#FBFBF9]">{m.name}</h4>
                            {m.title && (
                              <p className="text-sm text-slate-400 mt-0.5">{m.title}</p>
                            )}
                            {m.quote && (
                              <p className="text-sm text-slate-300 italic leading-relaxed">「{m.quote}」</p>
                            )}
                            {m.focusTags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {m.focusTags.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {m.wechat && <WeChatButton wechat={m.wechat} name={m.name} />}
                          </div>
                          {/* Image right */}
                          <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden rounded-xl flex-shrink-0 order-1 md:order-2">
                            {m.avatar ? (
                              <Image
                                src={m.avatar}
                                alt={m.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-slate-700 text-white font-bold text-5xl">
                                {m.name[0]}
                              </div>
                            )}
                            <div className="absolute top-4 right-4">
                              <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest shadow-lg">
                                {cityLabel}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Small cards (rest) */}
              {smallCards.map((m, i) => {
                const isOrange = i === 0
                const cityLabel = m.city || m.province
                return (
                  <div
                    key={m.id}
                    className={[
                      'col-span-12 sm:col-span-6 md:col-span-4 p-8 rounded-2xl',
                      isOrange
                        ? 'bg-primary'
                        : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-colors',
                    ].join(' ')}
                  >
                    <div className={`w-20 h-20 mb-6 rounded-full overflow-hidden border-2 ${isOrange ? 'border-white/50' : 'border-primary'} p-0.5 bg-slate-700`}>
                      {m.avatar ? (
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold rounded-full">
                          {m.name[0]}
                        </div>
                      )}
                    </div>

                    <span className={`${isOrange ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'} text-[10px] px-3 py-1 rounded-full font-bold mb-4 inline-block`}>
                      {cityLabel}
                    </span>

                    <h4 className={`text-xl font-bold ${isOrange ? 'text-white' : 'text-[#FBFBF9]'} mb-1`}>
                      {m.name}
                    </h4>

                    {m.title && (
                      <p className={`text-sm ${isOrange ? 'text-white/70' : 'text-slate-400'} mb-3`}>
                        {m.title}
                      </p>
                    )}

                    {m.bio && (
                      <p className={`text-sm ${isOrange ? 'text-white/90' : 'text-slate-400'} mb-6 line-clamp-2`}>
                        {m.bio}
                      </p>
                    )}

                    {m.wechat && (
                      <WeChatButton wechat={m.wechat} name={m.name} fullWidth white={isOrange} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 5: CTA */}
          <section className="border-t border-slate-200">
            <div className="py-24 px-8 max-w-[1280px] mx-auto text-center">
              <h2
                style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}
                className="text-slate-900 mb-8"
              >
                你的城市，<br />
                <span className="text-primary">还没有主理人。</span>
              </h2>
              <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                成为 OPC圈城市主理人，意味着你是这座城市 OPC 创业者最值得信任的连接者。官方背书、品牌曝光、本城社群资源——一城一人，排他制。
              </p>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                <a
                  href="mailto:cooperation@opcquan.com?subject=申请城市主理人（填写你的城市）"
                  className="bg-slate-900 text-white px-10 py-4 rounded-full font-semibold hover:bg-primary transition-all shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  发邮件申请
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Section 6: Contact */}
      <section className="border-t border-slate-200">
        <div className="py-24 px-8 max-w-[1280px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-8">联系我们</h2>
          <div className="space-y-4 text-slate-600">
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
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98]"
            >
              去广场看看
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
