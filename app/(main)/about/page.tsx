export const revalidate = false // 纯静态页，永久缓存

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '关于我们',
  description: 'OPC圈是专注于一人公司创业者的社区平台，汇集全国OPC社区资源，为AI创业者提供政策信息、入驻指南、创业交流服务',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8">
          关于我们
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-secondary mb-4">OPC圈是什么</h2>
            <p className="text-gray-600 leading-relaxed">
              OPC圈是一个专注于一人公司（One Person Company）创业者的社区平台。
              我们汇集全国各地的OPC创业社区资源，为AI创业者提供政策信息、入驻指南、
              创业交流的一站式服务。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-secondary mb-4">我们的愿景</h2>
            <p className="text-gray-600 leading-relaxed">
              让每一位独立创业者都能找到适合自己的创业社区，获得政策支持和资源扶持，
              与志同道合的创业者一起成长。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-secondary mb-4">核心功能</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span><strong>社区地图</strong>：一站式查看全国OPC社区分布，了解入驻政策和申请流程</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span><strong>创业广场</strong>：创业者日常交流、经验分享、问题求助的开放社区</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span><strong>合作广场</strong>：发布需求、寻找合作，连接商家与OPC创业者</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span><strong>创业资讯</strong>：汇聚政策动态、融资信息、行业趋势等创业相关资讯</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-secondary mb-4">加入我们</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              无论你是正在寻找创业空间的独立开发者，还是希望入驻OPC社区的AI创业者，
              我们都欢迎你加入OPC圈。
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-600 transition-colors"
            >
              立即注册
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
