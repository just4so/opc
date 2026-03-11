import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '全国OPC社区地图',
  description: '全国OPC创业社区攻略，覆盖苏州、深圳、上海、杭州等16+城市。真实入驻难度评分 + 避坑指南，帮你找到最适合的一人公司创业社区。',
  openGraph: {
    title: '全国OPC社区地图 | OPC创业圈',
    description: '全国OPC创业社区攻略，覆盖苏州、深圳、上海、杭州等16+城市。真实入驻难度评分 + 避坑指南，帮你找到最适合的一人公司创业社区。',
    url: 'https://www.opcquan.com/communities',
    siteName: 'OPC创业圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', 'OPC社区', '社区地图', '创业政策', '入驻申请'],
}

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
