export const revalidate = false // 纯静态页，永久缓存

import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '联系方式',
  description: '联系OPC圈团队，商务合作、社区入驻申请、内容投稿，邮箱：cooperation@opcquan.com',
}

const OPC_GROUP_QR_URL = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/qrcode/wechat-group.png'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8">
          联系方式
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-10">

          {/* 邮件联系 */}
          <section>
            <h2 className="text-xl font-semibold text-secondary mb-4">
              商务合作 & 意见反馈
            </h2>
            <p className="text-gray-600 mb-4">
              如果您有社区入驻申请、内容投稿、商务合作或使用反馈，欢迎通过邮件联系我们，我们会在 1-2 个工作日内回复。
            </p>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a
                href="mailto:cooperation@opcquan.com"
                className="text-primary hover:underline font-medium"
              >
                cooperation@opcquan.com
              </a>
            </div>
          </section>

          {/* 微信群 */}
          <section>
            <h2 className="text-xl font-semibold text-secondary mb-2">
              加入 OPC 创业者微信群
            </h2>
            <p className="text-gray-600 mb-6">
              扫码加入，与全国 OPC 创业者一起交流。群内包括：
            </p>
            <ul className="text-gray-600 space-y-2 mb-6 ml-1">
              <li className="flex items-center gap-2"><span className="text-primary">🤝</span> 合作对接 — 寻找搭档、互推资源、商务洽谈</li>
              <li className="flex items-center gap-2"><span className="text-primary">📦</span> 内部资源 — 政策解读、社区攻略、工具推荐优先获取</li>
              <li className="flex items-center gap-2"><span className="text-primary">🚀</span> 尝鲜反馈 — 优先体验 OPC圈新功能，直接和产品团队沟通</li>
            </ul>
            <div className="flex flex-col items-center sm:items-start">
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 inline-block">
                <Image
                  src={OPC_GROUP_QR_URL}
                  alt="OPC圈微信群二维码"
                  width={200}
                  height={200}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">二维码每 7 天更新，如已失效请发邮件告知</p>
            </div>
          </section>

          {/* 社区入驻 */}
          <section>
            <h2 className="text-xl font-semibold text-secondary mb-4">
              社区入驻申请
            </h2>
            <p className="text-gray-600">
              如果您运营 OPC 创业社区，希望将社区信息展示在平台上，请发邮件至
              {' '}<a href="mailto:cooperation@opcquan.com" className="text-primary hover:underline">cooperation@opcquan.com</a>，
              注明社区名称、城市、规模，我们会尽快与您联系并完成录入。
            </p>
          </section>

          {/* 内容投稿 */}
          <section>
            <h2 className="text-xl font-semibold text-secondary mb-4">
              内容投稿
            </h2>
            <p className="text-gray-600">
              欢迎 OPC 创业者分享入驻心得、经营经验或 AI 工具实战案例。投稿请发邮件并附上个人简介和文章正文，优质内容将在平台资讯区展示。
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
