import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创业广场',
  description: '创业者日常交流、经验分享、问题求助、资源推荐的开放社区',
}

export default function PlazaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
