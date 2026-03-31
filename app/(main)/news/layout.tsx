import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创业资讯',
  description: 'OPC创业者关注的政策动态、融资信息、赛事活动和AI科技趋势。汇聚一人公司与个人创业相关的最新资讯，助力OPC社区创业者把握行业动态、抓住发展机遇。',
  openGraph: {
    title: '创业资讯 | OPC圈',
    description: 'OPC创业者关注的政策动态、融资信息、赛事活动和AI科技趋势。汇聚一人公司与个人创业相关的最新资讯，助力OPC社区创业者把握行业动态、抓住发展机遇。',
    url: 'https://www.opcquan.com/news',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '创业资讯', '创业政策', 'AI科技', '行业趋势'],
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
