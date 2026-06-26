'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const categoryColors: Record<string, string> = {
  POLICY: 'bg-blue-50 text-blue-700',
  STORY: 'bg-orange-50 text-orange-700',
  EVENT: 'bg-green-50 text-green-700',
  TECH: 'bg-purple-50 text-purple-700',
}

const categoryLabels: Record<string, string> = {
  POLICY: '政策',
  STORY: '干货',
  EVENT: '动态',
  TECH: '观察',
}

export interface NewsItem {
  id: string
  title: string
  summary: string | null
  content?: string | null
  url: string
  source: string
  category: string
  coverImage: string | null
  publishedAt: string
  isOriginal?: boolean
  author?: string | null
}

type CarouselItem =
  | { kind: 'signal'; issueNo: number; title: string; publishedAt: string; intro: string | null; cities: string[] }
  | { kind: 'article'; id: string; title: string; summary: string | null; coverImage: string | null; publishedAt: string; author: string | null }

interface NewsClientProps {
  initialNews: NewsItem[]
  initialOriginals: NewsItem[]
  initialTotal: number
  policiesSlot?: ReactNode
  latestSignal?: {
    issueNo: number
    title: string
    publishedAt: string
    participants: any[]
  } | null
  allSignals?: Array<{
    issueNo: number
    title: string
    publishedAt: string
    intro: string | null
    participants: any[]
  }> | null
  recentOriginals?: NewsItem[] | null
}

function SignalCarouselCard({ item }: { item: Extract<CarouselItem, { kind: 'signal' }> }) {
  return (
    <div className="flex-shrink-0 w-[280px] md:w-[340px] h-48 bg-[#0F172A] rounded-xl snap-start p-5 flex flex-col justify-between">
      <div>
        <div className="text-white/60 text-xs mb-2">📡 Weekly Signal</div>
        <div className="mb-2">
          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded font-medium">
            第 {item.issueNo} 期
          </span>
        </div>
        <h3 className="text-white font-bold text-base line-clamp-2">{item.title}</h3>
        {item.intro && (
          <p className="text-white/70 text-xs line-clamp-2 mt-1">{item.intro.slice(0, 80)}</p>
        )}
      </div>
      <Link href={`/news/signal/${item.issueNo}`} className="text-primary text-xs">
        查看本期 →
      </Link>
    </div>
  )
}

function ArticleCarouselCard({ item }: { item: Extract<CarouselItem, { kind: 'article' }> }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className="flex-shrink-0 w-[280px] md:w-[340px] h-48 bg-white border border-[#E2E8F0] rounded-xl snap-start overflow-hidden flex flex-col"
    >
      <div className="h-24 w-full overflow-hidden flex-shrink-0">
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between min-h-0">
        <h3 className="text-sm font-semibold text-ink line-clamp-2">{item.title}</h3>
        <p className="text-xs text-mute mt-1">
          {item.author && <span className="mr-2">{item.author}</span>}
          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: zhCN })}
        </p>
      </div>
    </Link>
  )
}

function HeroCarousel({
  allSignals,
  recentOriginals,
}: {
  allSignals: Array<{ issueNo: number; title: string; publishedAt: string; intro: string | null; participants: any[] }>
  recentOriginals: NewsItem[]
}) {
  const items: CarouselItem[] = [
    ...allSignals.slice(0, 1).map((s) => ({
      kind: 'signal' as const,
      issueNo: s.issueNo,
      title: s.title,
      publishedAt: s.publishedAt,
      intro: s.intro,
      cities: (s.participants || []).map((p: any) => p.city).filter((c: any): c is string => !!c),
    })),
    ...recentOriginals.slice(0, 4).map((a) => ({
      kind: 'article' as const,
      id: a.id,
      title: a.title,
      summary: a.summary,
      coverImage: a.coverImage,
      publishedAt: a.publishedAt,
      author: a.author ?? null,
    })),
  ]

  if (!items.length) return null

  return (
    <div className="-mx-4 px-4">
      <div
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {items.map((item) =>
          item.kind === 'signal' ? (
            <SignalCarouselCard key={`signal-${item.issueNo}`} item={item} />
          ) : (
            <ArticleCarouselCard key={`article-${item.id}`} item={item} />
          )
        )}
      </div>
    </div>
  )
}

export function NewsClient({
  initialNews: _initialNews,
  initialOriginals: _initialOriginals,
  initialTotal: _initialTotal,
  policiesSlot,
  latestSignal: _latestSignal,
  allSignals,
  recentOriginals,
}: NewsClientProps) {
  const signals = allSignals ?? []
  const originals = recentOriginals ?? []

  return (
    <div>
      <PageHeader
        title={<>创业<span className="text-primary">洞察</span></>}
        subtitle="OPC 创业者的情报中心"
        theme="news"
      />
      <div className="container mx-auto px-4 py-8">

        {/* HeroCarousel */}
        <div className="mb-8">
          <HeroCarousel allSignals={signals} recentOriginals={originals} />
        </div>

        {/* 三栏主体 */}
        <div className="grid grid-cols-1 md:grid-cols-[9fr_6fr_5fr] gap-6 mt-8">

          {/* 主栏：Weekly Signal 列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink">Weekly Signal</h2>
              <Link href="/news/signal" className="text-primary text-xs">查看全部</Link>
            </div>
            {signals.length > 0 ? (
              <div className="space-y-3">
                {signals.slice(0, 5).map((s) => (
                  <div
                    key={s.issueNo}
                    className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary text-white text-xs px-2 py-0.5 rounded font-medium">
                        第 {s.issueNo} 期
                      </span>
                      <span className="text-xs text-mute">
                        {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink text-sm mb-1">{s.title}</h3>
                    {s.intro && (
                      <p className="text-mute text-xs line-clamp-2 mb-2">{s.intro.slice(0, 60)}</p>
                    )}
                    {(s.participants || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(s.participants as any[]).slice(0, 3).map((p: any, i: number) => (
                          p.city ? (
                            <span key={i} className="bg-surface-card text-mute text-xs px-2 py-0.5 rounded-full">
                              {p.city}
                            </span>
                          ) : null
                        ))}
                      </div>
                    )}
                    <Link href={`/news/signal/${s.issueNo}`} className="text-primary text-xs">
                      查看 →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-mute text-sm py-4 text-center">每周四更新</p>
            )}
          </div>

          {/* 次栏：OPC 圈原创（无数据时渲染空容器保持列布局） */}
          <div>
            {originals.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ink">OPC 圈原创</h2>
                  <Link href="/news" className="text-primary text-xs">查看全部</Link>
                </div>
                <div>
                  {originals.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="block border-b border-[#E2E8F0] py-3 group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[item.category] || 'bg-surface-card text-mute'}`}>
                          {categoryLabels[item.category] || item.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-ink line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-mute mt-1">
                        {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: zhCN })}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 侧栏：政策库 */}
          <div>
            {policiesSlot && (
              <>
                <h2 className="font-semibold text-ink mb-4">政策库</h2>
                {policiesSlot}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
