import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, MapPin, RefreshCw, ArrowRight, Eye, Users, Mail } from 'lucide-react'
import prisma from '@/lib/db'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '关于 OPC圈 | 中国一人公司创业者的连接平台',
  description: '让每一位OPC创业者，都能被世界看见。OPC圈收录全国线下社区，覆盖数十座城市，连接数千位一人公司创业者。',
}

const emails = [
  { label: '商务合作', email: 'cooperation@opcquan.com' },
  { label: '社区入驻', email: 'mutong@opcquan.com' },
  { label: '内容投稿', email: 'cooperation@opcquan.com' },
]

export default async function AboutPage() {
  const [communityCount, cityGroups, , setting] = await Promise.all([
    prisma.community.count(),
    prisma.community.groupBy({ by: ['city'] }),
    prisma.user.count(),
    prisma.siteSetting.findUnique({ where: { key: 'community_qrcode_url' } }),
  ])
  const cityCount = cityGroups.length
  const DEFAULT_QR = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/qrcode/wechat-group.png'
  const qrUrl = (setting?.value && setting.value.startsWith('http')) ? setting.value : DEFAULT_QR

  const facts = [
    {
      icon: CheckCircle2,
      badge: '人工核实',
      number: `${communityCount}`,
      unit: '个社区',
      desc: '不靠爬虫，每条信息都有人确认过，确保你看到的每个社区真实可信。',
    },
    {
      icon: MapPin,
      badge: '持续扩展',
      number: `${cityCount}`,
      unit: '座城市',
      desc: '从北上深到二三线，覆盖真实创业聚集地，找到适合你的城市。',
    },
    {
      icon: RefreshCw,
      badge: '实时同步',
      number: '每周',
      unit: '更新',
      desc: '政策变了、社区新开了，我们跟着更新，信息始终保持鲜活。',
    },
  ]

  return (
    <div className="min-h-screen bg-canvas">

      {/* Section 1: Brand Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden pb-12 py-8" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' }}>
        {/* 深色底 */}
        <div className="absolute inset-0 bg-slate-900 z-0" />
        {/* 橙色径向渐变 - 右上角 */}
        <div className="absolute -right-32 -top-32 w-[600px] h-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none z-0" />
        {/* 橙色渐变斑点 - 左下角 */}
        <div className="absolute -left-16 bottom-0 w-80 h-80 rounded-full bg-primary/10 blur-2xl pointer-events-none z-0" />
        {/* 左侧竖向橙色渐变条 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none z-0" />
        {/* 底部渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none z-0" />
        {/* 装饰圆圈轮廓 */}
        <div className="absolute right-16 top-16 w-64 h-64 rounded-full border border-primary/10 pointer-events-none z-0" />
        <div className="absolute right-32 top-32 w-32 h-32 rounded-full border border-primary/5 pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-orange-200/30 bg-slate-900/50 backdrop-blur-sm text-orange-200 text-xs font-medium uppercase tracking-widest">
              中国一人公司创业者的连接平台
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              OPC<span className="text-primary">圈</span>
            </h1>
            <div className="w-24 h-2 bg-primary rounded-full" />
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-2xl font-light">
              我们做一件事——<br />
              让每一个<strong className="text-white font-semibold">独自在跑的创业者</strong>，<br />
              找到属于自己的城市、圈子和同路人。
            </p>
          </div>
        </div>

        {/* 向下滚动箭头 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Section 2: Three Facts */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="mb-12 text-right">
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-4 leading-tight">
              我们在做什么<br />
              <span className="text-primary opacity-60">构筑真实的网络</span>
            </h2>
            <p className="text-lg text-mute border-r-4 border-primary pr-6 ml-auto max-w-2xl">
              通过人工核实与持续更新，为你提供最可靠的本地创业资源导航。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facts.map(f => (
              <div
                key={f.unit}
                className="bg-white rounded-2xl border border-hairline p-6 hover:border-primary transition-colors duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <f.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-xs text-primary font-bold tracking-widest uppercase mb-1">{f.badge}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black text-ink">{f.number}</span>
                  <span className="text-lg text-mute font-normal ml-2">{f.unit}</span>
                </div>
                <p className="text-sm text-mute leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Three Values */}
      <section className="bg-canvas">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-ink">「我们能帮你什么」</h2>
            <p className="text-mute mt-3">不止于信息，是全方位的支持</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {/* Left */}
            <div className="bg-canvas rounded-[32px] border border-hairline p-10 flex flex-col hover:shadow-sm transition-shadow duration-200">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                <MapPin className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-4">找到落脚点</h3>
              <p className="text-mute leading-relaxed flex-1">
                你想在哪座城市创业、预算多少、需要什么政策支持——我们帮你找到最合适的社区，迈出坚实的第一步。
              </p>
              <Link href="/communities" className="mt-8 text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all">
                浏览社区 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Center (highlighted) */}
            <div className="bg-slate-900 rounded-[32px] p-10 flex flex-col md:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-8 relative z-10 shadow-lg">
                <Eye className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">被看见</h3>
              <p className="text-slate-400 leading-relaxed flex-1 relative z-10">
                一个人做产品容易没人知道。广场是你对外的窗口，展示项目、获认证、找合作，让你的价值被看见。
              </p>
              <Link href="/plaza" className="mt-8 text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all relative z-10">
                去广场 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right */}
            <div className="bg-canvas rounded-[32px] border border-hairline p-10 flex flex-col hover:shadow-sm transition-shadow duration-200">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                <Users className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-4">不孤单</h3>
              <p className="text-mute leading-relaxed flex-1">
                全国有人在做和你一样的事。同城主理人、创业者群，让你在本地也有圈子，找到同路人。
              </p>
              <Link href="/local" className="mt-8 text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all">
                认识主理人 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Contact */}
      <section className="bg-surface-card">
        <div id="contact" className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-[40px] overflow-hidden shadow-xl border border-hairline">
            <div className="grid lg:grid-cols-5 min-h-[480px]">

              {/* Left: dark bg + QR code */}
              <div className="lg:col-span-3 bg-slate-900 p-6 md:p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/10 pointer-events-none" />
                <div>
                  <h2 className="text-3xl font-bold text-white mb-3">加入 OPC 创业者微信群</h2>
                  <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                    扫码加入，与全国 OPC 创业者交流。群内包括合作对接、政策解读、社区攻略和新功能尝鲜。
                  </p>
                </div>
                <div className="flex flex-col items-center lg:items-start gap-4 mt-10">
                  <div className="bg-white p-4 rounded-2xl w-52 h-52 flex items-center justify-center">
                    {qrUrl ? (
                      <Image
                        src={qrUrl}
                        alt="OPC圈微信群二维码"
                        width={176}
                        height={176}
                        className="rounded-xl"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                        二维码加载中
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">请使用微信扫描上方二维码</p>
                </div>
              </div>

              {/* Right: email contact */}
              <div className="lg:col-span-2 bg-slate-50 p-6 md:p-10 lg:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-10">
                  <Mail className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-bold text-ink">邮件联系</h3>
                </div>
                <div className="space-y-8">
                  {emails.map(item => (
                    <div
                      key={item.label}
                      className="group border-b border-hairline pb-6 last:border-0 hover:border-primary/30 transition-colors"
                    >
                      <div className="text-xs font-bold text-mute uppercase tracking-widest mb-2">{item.label}</div>
                      <a
                        href={`mailto:${item.email}?subject=${item.label}`}
                        className="text-lg font-semibold text-ink group-hover:text-primary transition-colors flex items-center justify-between"
                      >
                        {item.email}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
