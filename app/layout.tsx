import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.opcquan.com'),
  title: {
    default: 'OPC创业圈 - 一人公司创业社区',
    template: '%s | OPC创业圈',
  },
  description: '连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台',
  keywords: ['OPC', '一人公司', '创业', 'AI创业', '独立开发者', '数字游民', '创业社区', '创业政策'],
  authors: [{ name: 'OPC创业圈' }],
  verification: {
    other: {
      'baidu-site-verification': 'codeva-6pFFAPRpWD',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://www.opcquan.com',
    siteName: 'OPC创业圈',
    title: 'OPC创业圈 - 一人公司创业社区',
    description: '连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台',
    images: ['https://www.opcquan.com/logo.png'],
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OPC创业圈',
  url: 'https://www.opcquan.com',
  description: '一人公司创业者社区，聚合全国OPC创业社区信息、创业工具、合作资源',
  sameAs: [],
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
        {/* JSON-LD 结构化数据 */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />
        {/* 百度自动推送 */}
        <Script
          id="baidu-push"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
    var bp = document.createElement('script');
    var curProtocol = window.location.protocol.split(':')[0];
    if (curProtocol === 'https') {
        bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
    } else {
        bp.src = 'http://push.zhanzhang.baidu.com/push.js';
    }
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(bp, s);
})();`,
          }}
        />
      </body>
    </html>
  )
}
