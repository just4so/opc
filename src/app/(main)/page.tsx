'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
            发现全国<span className="text-primary">OPC社区</span>
            <br />
            开启你的AI创业之旅
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            OPC创业圈汇集全国各地一人公司创业社区资源，为AI创业者提供政策信息、
            入驻指南、创业交流的一站式服务平台
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-white hover:bg-primary-600 transition-colors"
            >
              探索社区地图
            </Link>
            <Link
              href={session ? "/plaza" : "/register"}
              className="inline-flex items-center justify-center rounded-lg border-2 border-secondary px-8 py-3 text-lg font-medium text-secondary hover:bg-secondary hover:text-white transition-colors"
            >
              {session ? '进入创业广场' : '加入创业圈'}
            </Link>
          </div>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">16+</div>
              <div className="text-gray-600 mt-2">覆盖城市</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">38+</div>
              <div className="text-gray-600 mt-2">OPC社区</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">100万+</div>
              <div className="text-gray-600 mt-2">算力补贴</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">免租</div>
              <div className="text-gray-600 mt-2">办公空间</div>
            </div>
          </div>
        </div>
      </section>

      {/* 热门城市 */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary text-center mb-12">
            热门城市OPC社区
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {['深圳', '杭州', '北京', '上海', '苏州', '常州', '无锡', '成都'].map((city) => (
              <Link
                key={city}
                href={`/communities?city=${city}`}
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-xl font-semibold text-secondary group-hover:text-primary transition-colors">
                  {city}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  查看OPC社区 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary text-center mb-12">
            平台核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-3">社区地图</h3>
              <p className="text-gray-600">
                一站式查看全国OPC社区分布，了解入驻政策、申请流程、配套服务
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-3">创业广场</h3>
              <p className="text-gray-600">
                创业者日常交流、经验分享、问题求助、资源推荐的开放社区
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-3">项目展示</h3>
              <p className="text-gray-600">
                展示你的创业项目，获取反馈、寻找早期用户、建立个人品牌
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            准备好开启你的OPC创业之旅了吗？
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            加入OPC创业圈，连接全国优质创业社区，获取政策支持，与志同道合的创业者一起成长
          </p>
          <Link
            href={session ? "/plaza" : "/register"}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-white hover:bg-primary-600 transition-colors"
          >
            {session ? '进入创业广场' : '立即加入'}
          </Link>
        </div>
      </section>
    </div>
  )
}
