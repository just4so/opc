import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '工具导航',
  description: 'OPC一人公司实战工具箱：建站开发、AI写作、出海工具等60+款工具，标注国内可用性。帮助个人创业者用最少成本搭建高效工作流。',
  openGraph: {
    title: '工具导航 | OPC圈',
    description: 'OPC一人公司实战工具箱：建站开发、AI写作、出海工具等60+款工具，标注国内可用性。帮助个人创业者用最少成本搭建高效工作流。',
    url: 'https://www.opcquan.com/tools',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
  keywords: ['OPC', '一人公司', '个人创业', '创业工具', 'AI工具', '效率工具', '工具推荐'],
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
