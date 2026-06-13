'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageCircle, Copy, Check, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface QrcodeButtonProps {
  wechat: string
  name: string
  city?: string
  fullWidth?: boolean
  white?: boolean
}

export function QrcodeButton({ wechat, name, city, fullWidth, white }: QrcodeButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isQrcode = wechat.startsWith('http')
  const cityLabel = city || name

  async function copy() {
    await navigator.clipboard.writeText(wechat)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={[
          'inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors active:scale-[0.98]',
          fullWidth ? 'w-full justify-center px-4 py-3' : 'px-4 py-2',
          white ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary/10 text-primary hover:bg-primary/20',
        ].join(' ')}
      >
        {isQrcode ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {isQrcode ? '加入同城创业者社群' : `联系 ${name}`}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          {isQrcode ? (
            <>
              <DialogHeader>
                <DialogTitle>加入 {cityLabel} OPC 创业者社群</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4 flex flex-col items-center">
                <p className="text-sm text-mute text-center">
                  扫码加入，与 {cityLabel} 本地 OPC 创业者交流
                </p>
                <div className="border border-hairline rounded-2xl overflow-hidden">
                  <Image
                    src={wechat}
                    alt="社群二维码"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
                <p className="text-xs text-ash text-center">
                  二维码由主理人 {name} 维护，如已失效请联系主理人
                </p>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>联系 {name}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-mute text-center">微信号</p>
                <div className="bg-surface-soft rounded-2xl px-4 py-3 text-center">
                  <span className="text-lg font-medium text-ink tracking-wide">{wechat}</span>
                </div>
                <Button onClick={copy} className="w-full" variant="outline">
                  {copied ? (
                    <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />已复制</span>
                  ) : (
                    <span className="flex items-center gap-2"><Copy className="h-4 w-4" />一键复制</span>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Backwards-compatible alias
export { QrcodeButton as WeChatButton }
