import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.opcquan.com'),
  title: {
    default: 'OPC圈 - OPC创业者，在这里连接、让世界看见',
    template: '%s | OPC圈',
  },
  description: 'OPC圈是全国最全的一人公司社区信息平台。人工核实收录全国OPC社区，提供入驻对接、创业者广场、政策解读，帮你找到社区、被行业看见。',
  keywords: ['OPC', '一人公司', '创业', 'AI创业', '独立开发者', '数字游民', '创业社区', '创业政策'],
  authors: [{ name: 'OPC圈' }],
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
    siteName: 'OPC圈',
    title: 'OPC圈 - OPC创业者，在这里连接、让世界看见',
    description: 'OPC圈是全国最全的一人公司社区信息平台。人工核实收录全国OPC社区，提供入驻对接、创业者广场、政策解读，帮你找到社区、被行业看见。',
    images: ['https://www.opcquan.com/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPC圈 - OPC创业者，在这里连接、让世界看见',
    description: 'OPC圈是全国最全的一人公司社区信息平台。人工核实收录全国OPC社区，提供入驻对接、创业者广场、政策解读，帮你找到社区、被行业看见。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OPC圈',
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
