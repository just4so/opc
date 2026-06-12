'use client'

import { useState } from 'react'
import { MessageCircle, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface WeChatButtonProps {
  wechat: string
  name: string
  fullWidth?: boolean
  white?: boolean
}

export function WeChatButton({ wechat, name, fullWidth, white }: WeChatButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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
        <MessageCircle className="h-4 w-4" />
        联系 {name}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
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
        </DialogContent>
      </Dialog>
    </>
  )
}
