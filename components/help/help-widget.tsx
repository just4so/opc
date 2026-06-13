'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'
import Image from 'next/image'

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/public/settings?key=help_qrcode_url')
      .then(r => r.json())
      .then(data => {
        setQrUrl(data.value ?? null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || !qrUrl) return null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-52 rounded-2xl border border-hairline-soft bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-ink">需要帮助？</span>
            <button
              onClick={() => setOpen(false)}
              className="text-ash hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-hairline-soft">
              <Image
                src={qrUrl}
                alt="企业微信二维码"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-mute text-center">扫码添加企业微信</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-hairline-soft shadow-md text-ash hover:text-primary hover:border-primary transition-colors active:scale-[0.98]"
        aria-label="帮助"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </>
  )
}
