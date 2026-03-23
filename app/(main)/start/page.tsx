import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'OPC创业者入门指南 | 找到你的起点',
  description:
    'OPC一人公司创业指南：大厂出走者、应届生、自由职业者的入门路径。真实案例 + 城市社区推荐，想做一人公司不知道怎么开始？从这里出发。',
  openGraph: {
    title: 'OPC创业者入门指南 | OPC创业圈',
    description: 'OPC一人公司创业指南：大厂出走者、应届生、自由职业者的入门路径。真实案例 + 城市社区推荐，想做一人公司不知道怎么开始？从这里出发。',
    url: 'https://www.opcquan.com/start',
    siteName: 'OPC创业圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '创业入门', '创业指南', '创业起步', 'OPC社区'],
}

const personas = [
  { emoji: '🏢', label: '大厂/职场出走者', anchor: 'worker' },
  { emoji: '🎓', label: '在校生/应届生', anchor: 'student' },
  { emoji: '🛠️', label: '专业技能变现者', anchor: 'professional' },
  { emoji: '📈', label: '副业想做大', anchor: 'sideproject' },
  { emoji: '🔍', label: '还在探索阶段', anchor: 'explore' },
] as const

export default function StartPage() {
  return (
    <div className="flex flex-col">
      {/* 第一屏：类型选择 */}
      <section className="py-24 px-4 bg-gradient-subtle">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
            你是哪种创业者？
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            找到你的起点，少走半年弯路
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {personas.map((p) => (
              <a
                key={p.anchor}
                href={`#${p.anchor}`}
                className="group p-6 rounded-xl bg-white shadow-soft hover:shadow-soft-lg card-hover text-center"
              >
                <div className="text-4xl mb-3">{p.emoji}</div>
                <div className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                  {p.label}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* A. 大厂/职场出走者 */}
      <section id="worker" className="py-20 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-3xl font-bold text-secondary mb-8">
            大厂/职场出走者
          </h2>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <h3 className="text-sm font-medium text-orange-600 mb-2">
                同类路径
              </h3>
              <p className="text-secondary leading-relaxed">
                前大厂产品经理，用AI接AI咨询，第3个月开始有稳定月收2-3万
              </p>
            </div>

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">
                建议第一步
              </h3>
              <p className="text-secondary leading-relaxed">
                整理3-5年积累的行业Know-how，用AI把它变成可交付的服务套餐，不要按小时报价
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐阅读
              </h3>
              <div className="space-y-2">
                <Link
                  href="/plaza/cmmkt083y000rb0hsx5mmh8v7"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 辞职出来单干大概是去年这个时候...
                </Link>
                <Link
                  href="/plaza/cmmkt089h000tb0hspori4og2"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我2018年开始做独立开发，到现在...
                </Link>
                <Link
                  href="/plaza/cmmkt0a28001fb0hspj5q1r0u"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我以前在VC圈混了十年，管理过大...
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐城市
              </h3>
              <div className="flex gap-3">
                {['苏州', '深圳', '上海'].map((city) => (
                  <Link
                    key={city}
                    href={`/communities?city=${city}`}
                    className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft transition-all"
            >
              加入OPC创业圈，找到同路人
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* B. 在校生/应届生 */}
      <section id="student" className="py-20 bg-gray-50 scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-4xl mb-4">🎓</div>
          <h2 className="text-3xl font-bold text-secondary mb-8">
            在校生/应届生
          </h2>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <h3 className="text-sm font-medium text-orange-600 mb-2">
                同类路径
              </h3>
              <p className="text-secondary leading-relaxed">
                00后用AI做毕设，1年后拿到3000万融资
              </p>
            </div>

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">
                建议第一步
              </h3>
              <p className="text-secondary leading-relaxed">
                先做一个解决你自己痛点的工具，发到GitHub或ProductHunt，收集第一批真实反馈
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐阅读
              </h3>
              <div className="space-y-2">
                <Link
                  href="/plaza/cmmkt08ra000zb0hsweg7ozef"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我们三个是00后，最大的2000年...
                </Link>
                <Link
                  href="/plaza/cmmkt08fq000vb0hs882xo2jv"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我是那种把毕设做成公司的人...
                </Link>
                <Link
                  href="/plaza/cmmkt0bqt001tb0hscmxkyhh9"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我今年27岁，在AI北纬社区工作...
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐城市
              </h3>
              <div className="flex gap-3">
                {['北京', '武汉', '杭州'].map((city) => (
                  <Link
                    key={city}
                    href={`/communities?city=${city}`}
                    className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft transition-all"
            >
              加入OPC创业圈，找到同路人
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* C. 专业技能变现者 */}
      <section id="professional" className="py-20 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-4xl mb-4">🛠️</div>
          <h2 className="text-3xl font-bold text-secondary mb-8">
            专业技能变现者
          </h2>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <h3 className="text-sm font-medium text-orange-600 mb-2">
                同类路径
              </h3>
              <p className="text-secondary leading-relaxed">
                PPT美工用AI工具，从接单设计师到年入60万的一人公司
              </p>
            </div>

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">
                建议第一步
              </h3>
              <p className="text-secondary leading-relaxed">
                用AI把你的核心服务做成标准化套餐，不再按小时报价，而是按成果收费
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐阅读
              </h3>
              <div className="space-y-2">
                <Link
                  href="/plaza/cmmkt08lm000xb0hs7fbwj1fp"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 从PPT美工变成年入60万的工作室...
                </Link>
                <Link
                  href="/plaza/cmmkt09460013b0hsutz3la06"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我是做自媒体MCN的，签约了几百...
                </Link>
                <Link
                  href="/plaza/cmmkt09wo001db0hsurujjwwl"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我做了个付费榜第一的App...
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐城市
              </h3>
              <p className="text-sm text-gray-600">
                不限城市，可在线服务全国客户
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft transition-all"
            >
              加入OPC创业圈，找到同路人
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* D. 副业想做大 */}
      <section id="sideproject" className="py-20 bg-gray-50 scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-4xl mb-4">📈</div>
          <h2 className="text-3xl font-bold text-secondary mb-8">
            副业想做大
          </h2>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <h3 className="text-sm font-medium text-orange-600 mb-2">
                同类路径
              </h3>
              <p className="text-secondary leading-relaxed">
                副业月收超过工资3个月后，果断注册公司，现在月流水8万
              </p>
            </div>

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">
                建议第一步
              </h3>
              <p className="text-secondary leading-relaxed">
                先注册公司（或个体工商户），合规化是第一步，不用等做大了再注册
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐阅读
              </h3>
              <div className="space-y-2">
                <Link
                  href="/plaza/cmmkt0b9r001nb0hs14wrqm6m"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我是全职宝妈，两个孩子，老大小学...
                </Link>
                <Link
                  href="/plaza/cmmkt0ay5001lb0hsy4cdycos"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 被裁员回老家之后，我做了第一个产...
                </Link>
                <Link
                  href="/plaza/cmmkt099s0015b0hsq4ealnhi"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 我40多岁，做过房地产咨询、做过三...
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐城市
              </h3>
              <p className="text-sm text-gray-600">
                就近选有OPC政策的城市
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft transition-all"
            >
              加入OPC创业圈，找到同路人
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* E. 还在探索阶段 */}
      <section id="explore" className="py-20 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold text-secondary mb-8">
            还在探索阶段
          </h2>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                OPC是什么？
              </h3>
              <div className="space-y-2 text-secondary leading-relaxed">
                <p>
                  OPC（One Person Company）是指一个人借助AI工具，完成传统团队才能做的事。
                </p>
                <p>
                  你不需要融资、不需要招人，只需要一台电脑和一个好想法。
                </p>
                <p>
                  全国已有多个城市推出OPC扶持政策，提供免租工位、创业补贴等支持。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                推荐阅读
              </h3>
              <div className="space-y-2">
                <Link
                  href="/plaza/cmmkt07k4000lb0hsffdpzcdd"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → AI会不会让OPC变成泡沫？一些冷...
                </Link>
                <Link
                  href="/plaza/cmmkt07sq000nb0hsj7jhixpi"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 出海是OPC最好的方向吗？正反两面...
                </Link>
                <Link
                  href="/plaza/cmmkt0bl4001rb0hswbu8vm8e"
                  className="block p-3 rounded-lg hover:bg-gray-50 text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  → 2025年8月入驻北纬AI社区，我是...
                </Link>
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft transition-all"
            >
              加入OPC创业圈，找到同路人
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
