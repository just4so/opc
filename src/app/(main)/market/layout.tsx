import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '合作广场',
  description: '发布需求、寻找合作，连接商家与OPC创业者',
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
