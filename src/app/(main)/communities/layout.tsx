import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '全国OPC社区地图',
  description: '浏览全国各地的OPC创业社区，了解入驻政策、申请流程和配套服务',
}

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
