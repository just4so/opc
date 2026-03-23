'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ConversationUser {
  id: string
  username: string
  name: string | null
  avatar: string | null
}

interface LastMessage {
  id: string
  content: string
  createdAt: string
  senderId: string
}

interface Conversation {
  id: string
  otherUser: ConversationUser
  lastMessage: LastMessage | null
  unreadCount: number
  updatedAt: string
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchConversations()
    }
  }, [session])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('获取对话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">私信</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 border animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">私信</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">暂无私信</p>
          <p className="text-sm text-gray-400">
            在用户主页点击"发送私信"开始对话
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* 头像 */}
              <div className="relative">
                {conv.otherUser?.avatar ? (
                  <img
                    src={conv.otherUser.avatar}
                    alt={conv.otherUser.name || conv.otherUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {(conv.otherUser?.name?.[0] || conv.otherUser?.username?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {conv.otherUser?.name || conv.otherUser?.username || '未知用户'}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {conv.updatedAt
                      ? formatDistanceToNow(new Date(conv.updatedAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })
                      : ''}
                  </span>
                </div>
                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {conv.lastMessage?.content || '暂无消息'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
