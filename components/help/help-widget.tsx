'use client'

import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, HelpCircle, X, FileQuestion, Boxes, Zap } from 'lucide-react'

const HELP_QR_URL = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1781329839659-n89s0u.png'
const COMMUNITY_QR_URL = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1776951048073-lg3iw0.jpg'

export function HelpWidget() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [qrModal, setQrModal] = useState<'help' | 'community' | null>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (pathname.startsWith('/admin')) return null

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    // 停留 300ms 才展开，快速路过不触发
    enterTimer.current = setTimeout(() => setExpanded(true), 300)
  }

  const handleMouseLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setExpanded(false), 200)
  }

  return (
    <>
      {/* ───────────────────────────────────────────
          移动端底部固定操作条
      ─────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-md border-t border-hairline-soft px-4 py-3 flex items-center gap-3 shadow-lg">
          <Link
            href="/plaza/new?type=DEMAND"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium active:scale-[0.97] transition-transform"
          >
            <FileQuestion className="h-4 w-4 shrink-0" />
            发布需求
          </Link>
          <Link
            href="/settings#products"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-card text-ink text-sm font-medium border border-hairline-soft active:scale-[0.97] transition-transform"
          >
            <Boxes className="h-4 w-4 shrink-0" />
            发布产品
          </Link>
        </div>
      </div>

      {/* ───────────────────────────────────────────
          桌面端 FAB（md 以上可见）
      ─────────────────────────────────────────── */}

      {/* QR Modal overlay */}
      {qrModal && (
        <div className="hidden md:block fixed inset-0 z-40" onClick={() => setQrModal(null)} />
      )}

      {/* QR Modal — 展开后贴右侧，从右下往左上弹出 */}
      {qrModal && (
        <div className="hidden md:block fixed bottom-20 right-6 z-50 w-56 rounded-2xl border border-hairline-soft bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-ink">
              {qrModal === 'help' ? '需要帮助？' : '加入 OPC 社群'}
            </span>
            <button onClick={() => setQrModal(null)} className="text-ash hover:text-ink transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-hairline-soft">
              <Image
                src={qrModal === 'help' ? HELP_QR_URL : COMMUNITY_QR_URL}
                alt={qrModal === 'help' ? '企业微信二维码' : '社群二维码'}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-mute text-center">
              {qrModal === 'help' ? '扫码添加企业微信' : '扫码加入 OPC 创业者社群'}
            </p>
          </div>
        </div>
      )}

      {/* 胶囊 FAB — 右对齐，向左展开 */}
      <div
        className="hidden md:flex fixed bottom-6 right-6 z-50 justify-end"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="flex flex-row-reverse items-center bg-primary text-white shadow-lg rounded-full overflow-hidden transition-all duration-300 ease-out"
          style={{
            // 收起：图标(16) + 文字(~52) + padding ≈ 130px
            // 展开：4 个操作项各约 100px + 图标区 ~40px ≈ 500px
            maxWidth: expanded ? '500px' : '130px',
            height: '48px',
          }}
        >
          {/* 右侧固定：图标（展开后文字消失，只留图标） */}
          <div
            className="flex items-center shrink-0 select-none transition-all duration-300"
            style={{
              paddingLeft: expanded ? '14px' : '12px',
              paddingRight: expanded ? '14px' : '16px',
            }}
          >
            <Zap className="h-4 w-4 shrink-0" fill="currentColor" />
            {/* 文字：收起时显示，展开后淡出收起 */}
            <span
              className="text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-250"
              style={{
                maxWidth: expanded ? '0px' : '80px',
                opacity: expanded ? 0 : 1,
                marginLeft: expanded ? '0px' : '8px',
                transition: 'max-width 300ms ease, opacity 200ms ease, margin-left 300ms ease',
              }}
            >
              开始连接
            </span>
          </div>

          {/* 左侧展开区域（flex-row-reverse 所以视觉上从右往左：需求→产品→社群→帮助） */}
          <div
            className="flex flex-row-reverse items-center transition-opacity duration-200 shrink-0"
            style={{ opacity: expanded ? 1 : 0 }}
          >
            {/* 发布需求（最靠近图标） */}
            <div className="w-px h-5 bg-white/30 shrink-0" />
            <Link
              href="/plaza/new?type=DEMAND"
              className="flex items-center gap-1.5 px-5 py-3 hover:bg-white/15 transition-colors whitespace-nowrap text-sm"
            >
              <FileQuestion className="h-3.5 w-3.5 shrink-0" />
              发布需求
            </Link>

            {/* 发布产品 */}
            <div className="w-px h-5 bg-white/30 shrink-0" />
            <Link
              href="/settings#products"
              className="flex items-center gap-1.5 px-5 py-3 hover:bg-white/15 transition-colors whitespace-nowrap text-sm"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0" />
              发布产品
            </Link>

            {/* 加入社群 */}
            <div className="w-px h-5 bg-white/30 shrink-0" />
            <button
              onClick={() => setQrModal('community')}
              className="flex items-center gap-1.5 px-5 py-3 hover:bg-white/15 transition-colors whitespace-nowrap text-sm"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              加入社群
            </button>

            {/* 帮助（最左） */}
            <div className="w-px h-5 bg-white/30 shrink-0" />
            <button
              onClick={() => setQrModal('help')}
              className="flex items-center gap-1.5 pl-6 pr-6 py-3 hover:bg-white/15 transition-colors whitespace-nowrap text-sm"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              帮助
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
