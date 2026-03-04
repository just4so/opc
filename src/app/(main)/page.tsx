'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MapPin, MessageSquare, Handshake, Cpu, ArrowRight } from 'lucide-react'
import { NewsCardCompact } from '@/components/news/news-card'

interface NewsItem {
  id: string
  title: string
  summary: string | null
  url: string
  source: string
  category: string
  coverImage: string | null
  publishedAt: string
}

interface Stats {
  totalCommunities: number
  totalCities: number
}

export default function HomePage() {
  const { data: session } = useSession()
  const [news, setNews] = useState<NewsItem[]>([])
  const [stats, setStats] = useState<Stats>({ totalCommunities: 0, totalCities: 0 })

  useEffect(() => {
    fetch('/api/news?limit=6')
      .then(res => res.json())
      .then(data => setNews(data.data || []))
      .catch(() => {})

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats({
        totalCommunities: data.totalCommunities || 0,
        totalCities: data.totalCities || 0,
      }))
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section - 更简洁的设计 */}
      <section className="relative py-24 px-4 bg-gradient-subtle overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 leading-tight">
            让 AI 创业者
            <br />
            <span className="text-gradient">不再孤独前行</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            连接全国 {stats.totalCommunities > 0 ? `${stats.totalCommunities}+` : '120+'} 个 OPC 社区，
            发现创业伙伴，共享资源与机会
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-medium text-white hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all"
            >
              探索社区
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={session ? "/plaza" : "/register"}
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-medium text-secondary hover:border-primary hover:text-primary transition-all"
            >
              {session ? '进入广场' : '免费加入'}
            </Link>
          </div>
        </div>
      </section>

      {/* 统计数据 - 更简洁的卡片 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: stats.totalCities > 0 ? `${stats.totalCities}+` : '--', label: '覆盖城市' },
              { value: stats.totalCommunities > 0 ? `${stats.totalCommunities}+` : '--', label: 'OPC 社区' },
              { value: '100万+', label: '算力补贴' },
              { value: '免租', label: '办公空间' },
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {item.value}
                </div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心功能 - 玻璃态卡片 */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              为创业者而生
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              无论你是独立开发者、自由职业者还是小团队，这里都有你需要的资源
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: '社区地图',
                desc: '发现身边的创业空间',
                href: '/communities',
                color: 'text-primary bg-primary-50',
              },
              {
                icon: MessageSquare,
                title: '创业广场',
                desc: '分享想法，碰撞灵感',
                href: '/plaza',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Handshake,
                title: '合作广场',
                desc: '技能互补，资源共享',
                href: '/market',
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                icon: Cpu,
                title: '模型广场',
                desc: '低成本接入 AI 能力',
                href: '/models',
                color: 'text-purple-600 bg-purple-50',
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group p-6 rounded-xl bg-white shadow-soft hover:shadow-soft-lg card-hover"
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 热门城市 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              热门城市
            </h2>
            <p className="text-gray-500">
              选择城市，探索当地的 OPC 创业社区
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['深圳', '杭州', '北京', '上海', '苏州', '常州', '无锡', '成都'].map((city) => (
              <Link
                key={city}
                href={`/communities?city=${city}`}
                className="group p-5 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors text-center"
              >
                <div className="text-lg font-medium text-secondary group-hover:text-primary transition-colors">
                  {city}
                </div>
                <div className="text-xs text-gray-400 mt-1 group-hover:text-primary-400">
                  查看社区 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 创业资讯 */}
      {news.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-secondary">
                创业资讯
              </h2>
              <Link
                href="/news"
                className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                查看更多
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-soft divide-y divide-gray-100">
              {news.map((item) => (
                <NewsCardCompact key={item.id} news={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA - 更简洁 */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            开启你的创业之旅
          </h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">
            加入 OPC 创业圈，与志同道合的创业者一起成长
          </p>
          <Link
            href={session ? "/plaza" : "/register"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-medium text-secondary hover:bg-gray-100 transition-colors"
          >
            {session ? '进入创业广场' : '免费注册'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
