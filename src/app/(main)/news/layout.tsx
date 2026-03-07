import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创业资讯',
  description: 'OPC创业者关注的政策动态、融资信息、赛事活动和AI科技趋势，助力一人公司创业成功',
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
