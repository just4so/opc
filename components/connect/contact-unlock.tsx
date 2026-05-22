'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone } from 'lucide-react'

interface ContactUnlockProps {
  slug: string
  contactName: string | null
  contactPhone: string | null
  contactWechat: string | null
  contactNote?: string | null
}

export function ContactUnlock({
  slug,
  contactName,
  contactPhone,
  contactWechat,
  contactNote,
}: ContactUnlockProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/inquiries?communitySlug=${slug}`)
      .then((res) => res.json())
      .then((data) => setUnlocked(data.unlocked === true))
      .catch(() => setUnlocked(false))
      .finally(() => setLoading(false))
  }, [slug])

  const hasContact = contactName || contactPhone || contactWechat

  if (!hasContact) return null

  return (
    <div className="flex items-start">
      <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
      <div>
        <div className="text-sm text-gray-500">联系信息</div>
        {loading ? (
          <div className="text-sm text-gray-400 mt-1">加载中...</div>
        ) : unlocked ? (
          <>
            {contactName && <div className="text-gray-700">{contactName}</div>}
            {contactWechat && (
              <div className="text-sm text-gray-500 mt-0.5">公众号：{contactWechat}</div>
            )}
            {contactPhone && (
              <div className="text-sm text-gray-500 mt-0.5">电话：{contactPhone}</div>
            )}
            {contactNote && (
              <div className="text-xs text-gray-400 mt-0.5">{contactNote}</div>
            )}
          </>
        ) : (
          <>
            {contactName && <div className="text-gray-700">{contactName}</div>}
            {contactWechat && (
              <div className="text-sm text-gray-400 mt-0.5">公众号：****</div>
            )}
            {contactPhone && (
              <div className="text-sm text-gray-400 mt-0.5">电话：****</div>
            )}
            <Link
              href={`/connect/${slug}`}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary text-on-primary text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              🟢 社区直通车 — 提交意向，专人帮你对接
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
