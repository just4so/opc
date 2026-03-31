import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '交流广场',
  description: 'OPC创业者社区：真实的创业故事、问题求助、经验分享。非成功学，是真实的一人公司创业者日记，来看看别人怎么做的。',
  openGraph: {
    title: '交流广场 | OPC创业圈',
    description: 'OPC创业者社区：真实的创业故事、问题求助、经验分享。非成功学，是真实的一人公司创业者日记，来看看别人怎么做的。',
    url: 'https://www.opcquan.com/plaza',
    siteName: 'OPC创业圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '交流广场', '创业交流', '经验分享', '创业社区'],
}

export default function PlazaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
