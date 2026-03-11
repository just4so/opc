import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '合作广场',
  description: '发布需求、寻找合作伙伴，连接商家与OPC一人公司创业者。在这里发布项目需求、寻找技术合作、对接个人创业资源，打造OPC社区高效协作平台。',
  openGraph: {
    title: '合作广场 | OPC创业圈',
    description: '发布需求、寻找合作伙伴，连接商家与OPC一人公司创业者。在这里发布项目需求、寻找技术合作、对接个人创业资源，打造OPC社区高效协作平台。',
    url: 'https://www.opcquan.com/market',
    siteName: 'OPC创业圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '合作广场', '需求发布', '项目合作', '资源对接'],
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
