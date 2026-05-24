import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创业者广场',
  description: '发现OPC一人公司创业者卡片，交流创业经验、问题求助、资源对接。真实的创业者社区，来找到你的创业伙伴。',
  openGraph: {
    title: '创业者广场 | OPC圈',
    description: '发现OPC一人公司创业者卡片，交流创业经验、问题求助、资源对接。真实的创业者社区，来找到你的创业伙伴。',
    url: 'https://www.opcquan.com/plaza',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '交流广场', '创业交流', '经验分享', '创业社区'],
}

export default function PlazaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
