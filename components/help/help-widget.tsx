'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Users, HelpCircle, X, FileQuestion, Boxes } from 'lucide-react'

export function HelpWidget() {
  const [open, setOpen] = useState(false)
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

  if (!loaded) return null

  const handleOverlayClick = () => {
    setOpen(false)
    setQrModal(null)
  }

  const handleMainButton = () => {
    if (qrModal) {
      setQrModal(null)
      return
    }
    setOpen(prev => !prev)
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
            {/* 发布产品 */}
            <div
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '150ms' }}
            >
              <Link
                href="/settings#products"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">发布产品</span>
                <div className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]">
                  <Boxes className="h-5 w-5" />
                </div>
              </Link>
            </div>

            {/* 发布需求 */}
            <div
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '100ms' }}
            >
              <Link
                href="/plaza/new?type=DEMAND"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">发布需求</span>
                <div className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]">
                  <FileQuestion className="h-5 w-5" />
                </div>
              </Link>
            </div>

            {/* 加入社群 */}
            <div
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '50ms' }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setQrModal('community'); setOpen(false) }}
                className="flex items-center gap-2"
              >
                <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">加入社群</span>
                <div className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]">
                  <Users className="h-5 w-5" />
                </div>
              </button>
            </div>

            {/* 帮助 */}
            {helpQrUrl && (
              <div
                style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 200ms ease, transform 200ms ease', transitionDelay: '0ms' }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setQrModal('help'); setOpen(false) }}
                  className="flex items-center gap-2"
                >
                  <span className="bg-white text-ink text-xs px-3 py-1.5 rounded-full shadow-sm border border-hairline-soft whitespace-nowrap">帮助</span>
                  <div className="w-10 h-10 rounded-full bg-white border border-hairline-soft shadow-md flex items-center justify-center text-ash hover:text-primary transition-colors active:scale-[0.98]">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={handleMainButton}
          className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-[0.95]"
          aria-label={open ? '收起' : '展开'}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </button>
      </div>
    </>
  )
}
