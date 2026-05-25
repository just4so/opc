'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface SuccessViewProps {
  qrcodeUrl: string | null
}

export function SuccessView({ qrcodeUrl }: SuccessViewProps) {
  return (
    <div className="w-full max-w-lg mx-auto bg-canvas rounded-2xl shadow-soft p-8">
      <div className="text-center mb-6">
        <div className="success-check-animate inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">资料已提交</h2>
        <p className="text-sm text-mute">OPC圈将在 1 个工作日内审核，审核通过后将直接推荐给社区</p>
      </div>

      <div className="bg-surface-soft rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-ink mb-3">添加 OPC圈 客服，第一时间获取审核结果</p>
        <div className="flex items-center justify-center">
          {qrcodeUrl ? (
            <img src={qrcodeUrl} alt="OPC圈客服二维码" className="w-[200px] h-[200px] rounded-xl object-contain" />
          ) : (
            <div className="w-[200px] h-[200px] bg-surface-card rounded-xl flex items-center justify-center text-sm text-mute">
              请在后台上传二维码
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 opacity-0 animate-[fadeInUp_400ms_ease-out_600ms_forwards]">
        <Link
          href="/plaza"
          className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-ink hover:bg-surface-card transition-colors"
        >
          <span>去广场看看其他创业者</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/settings#card"
          className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-ink hover:bg-surface-card transition-colors"
        >
          <span>完善你的创业者卡片</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
