import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创业洞察',
  description: 'OPC创业者的情报中心。汇聚一人公司政策动态、AI实战案例、社区情报与资源对接，每周更新 Weekly Signal。',
  openGraph: {
    title: '创业洞察 | OPC圈',
    description: 'OPC创业者的情报中心。汇聚一人公司政策动态、AI实战案例、社区情报与资源对接，每周更新 Weekly Signal。',
    url: 'https://www.opcquan.com/news',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '创业洞察', '创业政策', 'Weekly Signal', 'AI科技', '行业趋势'],
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
