'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, MapPin, Globe, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ensureUrl } from '@/lib/utils'

interface PrivateData {
  contactName: string | null
  contactPhone: string | null
  contactWechat: string | null
  contactNote: string | null
  unlocked: boolean
}

interface ContactSidebarProps {
  slug: string
  address?: string | null
  website?: string | null
}

export function ContactSidebar({ slug, address, website }: ContactSidebarProps) {
  const { data: session, status } = useSession()
  const [data, setData] = useState<PrivateData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    setLoading(true)
    fetch(`/api/community/${slug}/private`)
      .then((res) => res.json())
      .then((d: PrivateData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, session])

  const hasAddressOrWebsite = !!(address || website)

  return (
    <Card>
      <CardHeader>
        <CardTitle>联系信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 地址 */}
        {address && (
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-ash mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-mute">详细地址</div>
              <div className="text-charcoal text-sm">{address}</div>
            </div>
          </div>
        )}

        {/* 官网 */}
        {website && (
          <div className="flex items-start">
            <Globe className="h-5 w-5 text-ash mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-mute">官网</div>
              <a
                href={ensureUrl(website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                访问官网 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* 分隔线 */}
        {hasAddressOrWebsite && (
          <div className="border-t border-hairline-soft" />
        )}

        {/* ===== 联系方式区域（按登录态三级展示）===== */}

        {/* 状态0: session 加载中 */}
        {status === 'loading' && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-ash" />
          </div>
        )}

        {/* 状态1: 未登录 */}
        {status === 'unauthenticated' && (
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-ash mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-charcoal mb-1">登录后可查看联系方式</p>
              <Link
                href={`/register?callbackUrl=/communities/${slug}`}
                className="inline-flex items-center text-xs text-primary font-medium hover:underline"
              >
                免费注册查看 →
              </Link>
            </div>
          </div>
        )}

        {/* 状态2 + 3: 已登录 */}
        {status === 'authenticated' && (
          <>
            {/* loading */}
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-ash" />
              </div>
            )}

            {/* 数据加载完成 */}
            {!loading && data && (() => {
              const { contactName, contactPhone, contactWechat, contactNote, unlocked } = data
              const hasContact = !!(contactName || contactPhone || contactWechat)

              return (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-ash mr-3 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {hasContact ? (
                      <>
                        {contactName && <div className="text-charcoal text-sm font-medium">{contactName}</div>}

                        {unlocked ? (
                          /* 已解锁：显示真实联系方式，无直通车 */
                          <>
                            {contactWechat && (
                              <div className="text-sm text-mute mt-0.5">公众号：{contactWechat}</div>
                            )}
                            {contactPhone && (
                              <div className="text-sm text-mute mt-0.5">电话：{contactPhone}</div>
                            )}
                            {contactNote && (
                              <div className="text-xs text-ash mt-1 leading-relaxed">{contactNote}</div>
                            )}
                          </>
                        ) : (
                          /* 未解锁：电话打码 + 直通车入口 */
                          <>
                            {contactWechat && (
                              <div className="text-sm text-mute mt-0.5">公众号：{contactWechat}</div>
                            )}
                            {contactPhone && (
                              <div className="text-sm text-ash mt-0.5">电话：****</div>
                            )}
                            <Link
                              href={`/connect/${slug}`}
                              className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-2xl hover:bg-primary/90 transition-colors shadow-sm"
                            >
                              🟢 社区直通车 - 立即申请入驻
                            </Link>
                            <p className="text-xs text-ash mt-1.5 leading-relaxed">
                              提交资料后由 OPC圈 审核推荐，同时解锁联系方式
                            </p>
                          </>
                        )}
                      </>
                    ) : (
                      /* 无联系人数据：只有直通车 */
                      <>
                        <div className="text-sm text-mute">申请入驻获取对接</div>
                        <Link
                          href={`/connect/${slug}`}
                          className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-2xl hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          🟢 社区直通车 - 立即申请入驻
                        </Link>
                        <p className="text-xs text-ash mt-1.5 leading-relaxed">
                          提交资料后由 OPC圈 审核推荐，同时解锁联系方式
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
