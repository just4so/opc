import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://opcquan.com'),
  title: {
    default: 'OPC创业圈 - 一人公司创业社区',
    template: '%s | OPC创业圈',
  },
  description: '连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台',
  keywords: ['OPC', '一人公司', '创业', 'AI创业', '独立开发者', '数字游民', '创业社区', '创业政策'],
  authors: [{ name: 'OPC创业圈' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://opcquan.com',
    siteName: 'OPC创业圈',
    title: 'OPC创业圈 - 一人公司创业社区',
    description: '连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPC创业圈 - 一人公司创业社区',
    description: '连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
