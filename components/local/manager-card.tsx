'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Manager {
  id: string
  name: string
  avatar: string | null
  title: string | null
  bio: string | null
  quote: string | null
  focusTags: string[]
  wechat: string | null
  city: string | null
  province: string
}

interface Props {
  manager: Manager
  index: number
}

export function ManagerCard({ manager, index }: Props) {
  const [open, setOpen] = useState(false)
  const isEven = index % 2 === 0
  const cityDisplay = manager.city || manager.province
  const hasQrcode = !!manager.wechat && manager.wechat.startsWith('http')

  return (
    <>
      <div
        className={`flex flex-col md:flex-row ${!isEven ? 'md:flex-row-reverse' : ''} items-center gap-8 group bg-surface-card rounded-2xl p-6 md:p-8 border border-hairline hover:border-primary/30 transition-colors`}
      >
        {/* 头像 */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-primary/20 bg-surface overflow-hidden flex-shrink-0">
          {manager.avatar ? (
            <Image
              src={manager.avatar}
              alt={manager.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <span className="text-3xl md:text-4xl font-bold text-mute">{manager.name[0]}</span>
            </div>
          )}
        </div>

        {/* 文字区：移动端居中，桌面端按奇偶左/右对齐 */}
        <div className={`flex-1 text-center ${isEven ? 'md:text-left' : 'md:text-right'}`}>
          <h4
            className="text-ink mb-1"
            style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 }}
          >
            {manager.name}
            {manager.title && (
              <span className="text-sm text-mute ml-2 font-normal" style={{ fontFamily: 'inherit' }}>
                {manager.title}
              </span>
            )}
          </h4>

          {manager.bio && (
            <p className="text-sm text-mute leading-relaxed mb-4 line-clamp-3">{manager.bio}</p>
          )}

          {manager.quote && (
            <p className="text-sm italic text-primary/80 mb-4">「{manager.quote}」</p>
          )}

          {manager.focusTags.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-4 justify-center ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
              {manager.focusTags.map(tag => (
                <span key={tag} className="text-[11px] font-medium text-primary border border-primary/30 px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {hasQrcode && (
            <div className={`flex justify-center ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
              <button
                onClick={() => setOpen(true)}
                className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium tracking-wider hover:bg-primary/90 transition-colors"
              >
                加入同城社群
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>加入 {cityDisplay} OPC 创业者社群</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-mute mb-4">扫码加入，与{cityDisplay}本地 OPC 创业者交流</p>
          {manager.wechat && (
            <div className="flex justify-center mb-4">
              <Image src={manager.wechat} alt="社群二维码" width={200} height={200} unoptimized />
            </div>
          )}
          <p className="text-xs text-mute">二维码由主理人 {manager.name} 维护</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
