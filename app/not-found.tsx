import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <span className="text-3xl font-bold text-primary">OPC</span>
          <span className="text-2xl font-semibold text-secondary">圈</span>
        </Link>

        {/* 404 标识 */}
        <div className="text-8xl font-bold text-gray-200 mb-4 select-none">404</div>

        <h1 className="text-2xl font-bold text-secondary mb-3">页面不存在</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          你访问的页面已不存在或被移走了。<br />
          别担心，去首页看看其他内容吧！
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              回到首页
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/communities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              社区地图
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
