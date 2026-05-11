/**
 * OPC Radar RSS 源配置
 *
 * 只保留直连原生 RSS，不依赖本地 RSSHub。
 * 已移除：RSSHub Tier2/3 政务路由（实际贡献 0 条，2026-05-10 验证）
 * 已移除：w2solo / ezindie（实际贡献 0 条）
 *
 * 更新时间：2026-05-10
 */

export interface RssSource {
  name: string
  url: string
  tier: 1 | 2 | 3
  category: 'policy' | 'community' | 'media' | 'developer' | 'content'
  baseImportanceBonus?: number
  guaranteed?: boolean  // true = 100% OPC相关，跳过AI判断直接入库
  description?: string
}

export const RSS_SOURCES: RssSource[] = [
  // ── 人民日报（政策风向标）──────────────────────────────────────
  {
    name: '人民日报-政治',
    url: 'http://www.people.com.cn/rss/politics.xml',
    tier: 1,
    category: 'policy',
    baseImportanceBonus: 1,
    description: '中央政策第一手信号',
  },
  {
    name: '人民日报-财经',
    url: 'http://www.people.com.cn/rss/money.xml',
    tier: 1,
    category: 'policy',
    description: '经济政策、创业金融',
  },
  {
    name: '人民日报-科技',
    url: 'http://www.people.com.cn/rss/it.xml',
    tier: 1,
    category: 'media',
    description: 'AI/科技产业政策',
  },
  {
    name: '人民日报-社会',
    url: 'http://www.people.com.cn/rss/society.xml',
    tier: 1,
    category: 'media',
    description: '社会就业、灵活用工',
  },

  // ── 商业媒体（直连）────────────────────────────────────────────
  {
    name: '36氪',
    url: 'https://36kr.com/feed',
    tier: 1,
    category: 'media',
    description: '创业/科技动态，OPC社区开业报道多',
  },
  {
    name: '澎湃新闻',
    url: 'https://www.thepaper.cn/rss_cn.xml',
    tier: 1,
    category: 'media',
    description: '地方政策落地报道',
  },
  {
    name: '经济观察报',
    url: 'https://www.eeo.com.cn/rss.xml',
    tier: 1,
    category: 'policy',
    description: '经济政策深度',
  },
  {
    name: '中新网',
    url: 'https://www.chinanews.com.cn/rss/scroll-news.xml',
    tier: 1,
    category: 'media',
    description: '综合新闻，政策密度高',
  },
]

// 按 tier 分组，方便按优先级采集
export const SOURCES_BY_TIER = {
  tier1: RSS_SOURCES.filter((s) => s.tier === 1),
  tier2: RSS_SOURCES.filter((s) => s.tier === 2),
  tier3: RSS_SOURCES.filter((s) => s.tier === 3),
}

// 全局统计
export const SOURCE_STATS = {
  total: RSS_SOURCES.length,
  tier1: RSS_SOURCES.filter((s) => s.tier === 1).length,
  tier2: RSS_SOURCES.filter((s) => s.tier === 2).length,
  tier3: RSS_SOURCES.filter((s) => s.tier === 3).length,
}
