'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Package, Users, HelpCircle, X, FileQuestion, Boxes } from 'lucide-react'

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [helpQrUrl, setHelpQrUrl] = useState<string | null>(null)
  const [communityQrUrl, setCommunityQrUrl] = useState<string | null>(null)
  const [qrModal, setQrModal] = useState<'help' | 'community' | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings?key=help_qrcode_url').then(r => r.json()).catch(() => ({ value: null })),
      fetch('/api/public/settings?key=community_qrcode_url').then(r => r.json()).catch(() => ({ value: null })),
    ]).then(([helpData, communityData]) => {
      setHelpQrUrl(helpData.value ?? null)
      setCommunityQrUrl(communityData.value ?? null)
      setLoaded(true)
    })
  }, [])

  // Only render if at least help QR exists (matching original behavior)
  if (!loaded) return null

  const handleOverlayClick = () => {
    setOpen(false)
    setShowPublish(false)
    setQrModal(null)
  }

  const handleMainButton = () => {
    if (qrModal) {
      setQrModal(null)
      return
    }
    setOpen(prev => !prev)
    setShowPublish(false)
  }

  return (
    <>
      {/* Overlay */}
      {(open || qrModal) && (
        <div className="fixed inset-0 z-40" onClick={handleOverlayClick} />
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed bottom-20 right-5 z-50 w-56 rounded-2xl border border-hairline-soft bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-ink">
              {qrModal === 'help' ? '需要帮助？' : '加入 OPC 社群'}
            </span>
            <button
              onClick={() => setQrModal(null)}
              className="text-ash hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            {(qrModal === 'help' ? helpQrUrl : communityQrUrl) ? (
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-hairline-soft">
                <Image
                  src={(qrModal === 'help' ? helpQrUrl : communityQrUrl)!}
                  alt={qrModal === 'help' ? '企业微信二维码' : '社群二维码'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-surface-card flex items-center justify-center text-xs text-ash">
                暂无二维码
              </div>
            )}
            <p className="text-xs text-mute text-center">
              {qrModal === 'help' ? '扫码添加企业微信' : '扫码加入 OPC 创业者社群'}
            </p>
          </div>
        </div>
      )}

      {/* Speed Dial Items */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {/* 帮助 */}
            {helpQrUrl && (
              <div
                className="flex items-center gap-2 speed-dial-item"
                style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '0ms' }}
              >
                <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">帮助</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setQrModal('help'); setOpen(false) }}
                  className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]"
                  aria-label="帮助"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* 加入社群 */}
            <div
              className="flex items-center gap-2"
              style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '50ms' }}
            >
              <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">加入社群</span>
              <button
                onClick={(e) => { e.stopPropagation(); setQrModal('community'); setOpen(false) }}
                className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]"
                aria-label="加入社群"
              >
                <Users className="h-5 w-5" />
              </button>
            </div>

            {/* 发布 (with sub-options) */}
            <div
              className="flex flex-col items-end gap-2"
              style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '100ms' }}
            >
              {/* Sub-options when showPublish is true */}
              {showPublish && (
                <div className="flex flex-col items-end gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">发布需求</span>
                    <Link
                      href="/plaza/new?type=DEMAND"
                      onClick={() => { setOpen(false); setShowPublish(false) }}
                      className="w-9 h-9 rounded-full bg-white border border-hairline-soft shadow-sm flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]"
                      aria-label="发布需求"
                    >
                      <FileQuestion className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">发布产品</span>
                    <Link
                      href="/settings#products"
                      onClick={() => { setOpen(false); setShowPublish(false) }}
                      className="w-9 h-9 rounded-full bg-white border border-hairline-soft shadow-sm flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]"
                      aria-label="发布产品"
                    >
                      <Boxes className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">发布</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPublish(prev => !prev) }}
                  className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]"
                  aria-label="发布"
                >
                  <Package className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main button */}
        <button
          onClick={handleMainButton}
          className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-[0.95]"
          aria-label={open ? '收起' : '展开'}
        >
          <Plus
            className="h-6 w-6 transition-transform duration-300"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>
    </>
  )
}
