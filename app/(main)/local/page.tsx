import { Metadata } from 'next'
import prisma from '@/lib/db'
import { MapPin, MessageSquare, Users } from 'lucide-react'
import { ManagerCard } from '@/components/local/manager-card'
import { CityNav } from '@/components/local/city-nav'
import { MobileCityTabs } from '@/components/local/mobile-city-tabs'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '同城 | OPC圈',
  description: 'OPC圈城市主理人，是本地最资深的 OPC 创业者。他们摸清了政策、踩过了坑、建好了圈子——希望和你成为同路人。',
}

const pillars = [
  {
    icon: MapPin,
    title: '本地向导',
    desc: '帮你了解本地 OPC 社区和政策，快速融入新环境',
  },
  {
    icon: MessageSquare,
    title: '同城社群',
    desc: '加入主理人管理的同城微信群，与本地同行即时交流',
  },
  {
    icon: Users,
    title: '资源对接',
    desc: '创业政策解读、社区场地选择、核心人脉介绍',
  },
]

export default async function LocalPage() {
  const managers = await prisma.cityManager.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ order: 'desc' }, { createdAt: 'asc' }],
  })

  // 按城市分组
  const cityMap = new Map<string, typeof managers>()
  for (const m of managers) {
    const city = m.city || m.province
    if (!cityMap.has(city)) cityMap.set(city, [])
    cityMap.get(city)!.push(m)
  }

  // 城市排序：取该城市主理人的最大 order 值，降序
  const cityGroups = Array.from(cityMap.entries())
    .sort((a, b) => {
      const maxA = Math.max(...a[1].map(m => m.order))
      const maxB = Math.max(...b[1].map(m => m.order))
      return maxB - maxA
    })
    .map(([city, cityManagers]) => ({ city, managers: cityManagers }))

  const cities = cityGroups.map(g => g.city)

  return (
    <div className="min-h-screen bg-canvas">
      {/* Section 1: Hero + 三栏合并 */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <MapPin className="h-12 w-12 text-primary/60 mb-8" strokeWidth={1} />

        <h1
          className="text-ink mb-6 leading-tight"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 700 }}
        >
          在这座城市，你不用一个人摸索
        </h1>

        <p className="text-[18px] leading-loose text-mute max-w-2xl mx-auto mb-16">
          OPC圈城市主理人，是本地最资深的 OPC 创业者。他们摸清了政策、踩过了坑、建好了圈子——希望和你成为同路人。
        </p>

        <div className="w-full border-t border-hairline pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {pillars.map(p => (
              <div key={p.title} className="flex flex-col items-center text-center">
                <p.icon className="h-8 w-8 text-primary mb-4" strokeWidth={1} />
                <h3
                  className="text-ink mb-2"
                  style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '20px', fontWeight: 600 }}
                >
                  {p.title}
                </h3>
                <p className="text-sm text-mute leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* story-divider */}
      <div className="flex justify-center my-2">
        <div
          style={{
            width: '1px',
            height: '60px',
            background: 'linear-gradient(to bottom, transparent, #F97316, transparent)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Section 2: 主理人列表 */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2
            className="text-ink tracking-widest mb-4"
            style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '36px', fontWeight: 700 }}
          >
            城市主理人
          </h2>
          <p className="text-mute text-base">真实的人，真实的经验，真实的圈子——和你一起探索</p>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-16 text-mute">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" strokeWidth={1} />
            <p>主理人招募中，敬请期待</p>
          </div>
        ) : (
          <div className="flex gap-12">
            {/* 左侧城市导航（桌面） */}
            <CityNav cities={cities} />

            {/* 右侧主理人列表（按城市分组） */}
            <div className="flex-1 min-w-0">
              {/* 移动端城市 tab */}
              <MobileCityTabs cities={cities} />

              <div className="flex flex-col gap-16">
                {cityGroups.map(({ city, managers: cityManagers }) => (
                  <div key={city} id={`city-${city}`} className="scroll-mt-24">
                    {/* 城市标题 */}
                    <div className="flex items-center gap-3 mb-8">
                      <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <h3 className="text-base font-medium text-primary tracking-widest">{city}</h3>
                      <div className="flex-1 h-px bg-hairline" />
                    </div>
                    {/* 该城市主理人列表 */}
                    <div className="flex flex-col gap-8">
                      {cityManagers.map((m, i) => (
                        <ManagerCard key={m.id} manager={m} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* story-divider */}
      <div className="flex justify-center my-2">
        <div
          style={{
            width: '1px',
            height: '60px',
            background: 'linear-gradient(to bottom, transparent, #F97316, transparent)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Section 3: 底部 CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <MapPin className="h-12 w-12 mx-auto text-mute/40 mb-8" strokeWidth={1} />
        <h2
          className="text-ink tracking-widest mb-8"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700 }}
        >
          你的城市还没有主理人？
        </h2>
        <p className="text-[18px] text-mute leading-loose max-w-xl mx-auto mb-12">
          你对本地 OPC 圈最熟，也最有资格帮大家少走弯路。一城一人，我们提供官方背书和资源支持，你来做那个连接点。
        </p>
        <a
          href="mailto:cooperation@opcquan.com?subject=申请城市主理人"
          className="inline-block bg-primary text-white px-12 py-4 rounded-full text-base font-medium tracking-widest hover:bg-primary/90 transition-colors shadow-sm"
        >
          申请成为主理人
        </a>
      </section>
    </div>
  )
}
