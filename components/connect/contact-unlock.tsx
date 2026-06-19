'use client'

import Link from 'next/link'
import { Phone } from 'lucide-react'

interface ContactUnlockProps {
  slug: string
  unlocked: boolean
  contactName: string | null
  contactPhone: string | null
  contactWechat: string | null
  contactNote?: string | null
}

export function ContactUnlock({
  slug,
  unlocked,
  contactName,
  contactPhone,
  contactWechat,
  contactNote,
}: ContactUnlockProps) {
  const hasContact = contactName || contactPhone || contactWechat

  return (
    <div className="flex items-start">
      <Phone className="h-5 w-5 text-ash mr-3 mt-0.5" />
      <div>
        {hasContact && <div className="text-sm text-mute">联系信息</div>}
        {hasContact && (
          unlocked ? (
            <>
              {contactName && <div className="text-charcoal">{contactName}</div>}
              {contactWechat && (
                <div className="text-sm text-mute mt-0.5">公众号：{contactWechat}</div>
              )}
              {contactPhone && (
                <div className="text-sm text-mute mt-0.5">电话：{contactPhone}</div>
              )}
              {contactNote && (
                <div className="text-xs text-ash mt-0.5">{contactNote}</div>
              )}
            </>
          ) : (
            <>
              {contactName && <div className="text-charcoal">{contactName}</div>}
              {contactWechat && (
                <div className="text-sm text-mute mt-0.5">公众号：{contactWechat}</div>
              )}
              {contactPhone && (
                <div className="text-sm text-ash mt-0.5">电话：****</div>
              )}
            </>
          )
        )}
        <Link
          href={`/connect/${slug}`}
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary text-on-primary text-xs font-medium rounded-2xl hover:bg-primary-600 transition-colors"
        >
          🟢 社区直通车 - 立即申请入驻
        </Link>
        <p className="text-xs text-ash mt-1.5">提交资料后由 OPC圈 审核推荐，同时解锁联系方式</p>
      </div>
    </div>
  )
}
