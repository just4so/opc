'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { X, MessageCircle, Mail, Phone, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Owner {
  name: string | null
  username: string
  wechat: string | null
  email: string | null
  phone: string | null
}

interface ContactButtonProps {
  owner: Owner
}

export function ContactButton({ owner }: ContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const hasContact = owner.wechat || owner.email || owner.phone

  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline">
          <LogIn className="h-4 w-4 mr-2" />
          登录后查看联系方式
        </Button>
      </Link>
    )
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>查看联系方式</Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-secondary mb-4">
              {owner.name || owner.username} 的联系方式
            </h3>

            {hasContact ? (
              <div className="space-y-4">
                {owner.wechat && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">微信</div>
                      <div className="font-medium text-gray-900">{owner.wechat}</div>
                    </div>
                  </div>
                )}
                {owner.email && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">邮箱</div>
                      <div className="font-medium text-gray-900">{owner.email}</div>
                    </div>
                  </div>
                )}
                {owner.phone && (
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <Phone className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">手机</div>
                      <div className="font-medium text-gray-900">{owner.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                该用户暂未设置联系方式
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
