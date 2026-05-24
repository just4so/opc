export const revalidate = false

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '关于 OPC圈',
  description: 'OPC圈是中国最真最全的一人公司社区信息平台。人工核实 + 创业者共创，帮 OPC 创业者找到社区、被行业看见。',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-8">
          关于 OPC圈
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-ink mb-4">我们是谁</h2>
            <p className="text-mute leading-relaxed">
              OPC圈是中国最真最全的一人公司（One Person Company）社区信息平台。
              我们人工核实全国 OPC 社区的入驻信息，联合创业者共创内容，帮助每一位
              OPC 创业者找到适合自己的社区，同时被行业看见。
            </p>
            <p className="text-mute leading-relaxed mt-4">
              OPC圈由北京数据胶囊科技有限公司运营。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-ink mb-4">我们做什么</h2>
            <ul className="space-y-4 text-mute">
              <li className="flex items-start">
                <span className="text-primary mr-3 text-xl">🏢</span>
                <div>
                  <strong>社区信息</strong>
                  <p className="mt-1">收录全国 180+ 个 OPC 社区，覆盖 60+ 个城市。每个社区的入驻费用、政策福利、配套设施均经人工核实，拒绝虚假信息。</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 text-xl">🟢</span>
                <div>
                  <strong>社区直通车</strong>
                  <p className="mt-1">一键提交入驻意向，由 OPC圈 审核后直接推荐给社区。省去自己一家家打电话的麻烦。</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 text-xl">🤝</span>
                <div>
                  <strong>创业者广场</strong>
                  <p className="mt-1">展示你自己和你的产品，找到合作伙伴和客户。不是冷冰冰的名片墙，而是有动态、有互动的创业者社区。</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 text-xl">📡</span>
                <div>
                  <strong>OPC 雷达</strong>
                  <p className="mt-1">每日追踪全国 OPC 政策动态、行业新闻、融资消息，帮你掌握一手信息。</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-ink mb-4">联系我们</h2>
            <div className="space-y-3 text-mute">
              <p>商务合作：<a href="mailto:cooperation@opcquan.com" className="text-primary hover:underline">cooperation@opcquan.com</a></p>
              <p>社区收录/纠错：在任意社区详情页底部点击「我是该社区运营方」或「提交社区收录」</p>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/communities"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-medium text-white hover:bg-primary-600 transition-colors"
              >
                找到我的社区
              </Link>
              <Link
                href="/plaza"
                className="inline-flex items-center justify-center rounded-xl border border-hairline px-6 py-3 font-medium text-ink hover:bg-surface-soft transition-colors"
              >
                去广场看看
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
