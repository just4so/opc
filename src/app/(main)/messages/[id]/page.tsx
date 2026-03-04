'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface MessageUser {
  id: string
  username: string
  name: string | null
  avatar: string | null
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: MessageUser
}

interface ConversationData {
  id: string
  otherUser: MessageUser
  messages: Message[]
}

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && conversationId) {
      fetchConversation()
    }
  }, [session, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversation = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setConversation(data.conversation)
      } else if (res.status === 404) {
        router.push('/messages')
      }
    } catch (error) {
      console.error('获取对话失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setConversation((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          }
        })
        setMessage('')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setSending(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg border min-h-[600px] flex flex-col animate-pulse">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                  <div className="h-10 bg-gray-200 rounded-lg w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user || !conversation) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg border min-h-[600px] flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b flex items-center gap-4">
          <Link
            href="/messages"
            className="p-2 -ml-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link
            href={`/profile/${conversation.otherUser?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {conversation.otherUser?.avatar ? (
              <img
                src={conversation.otherUser.avatar}
                alt={conversation.otherUser.name || conversation.otherUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {(conversation.otherUser?.name?.[0] || conversation.otherUser?.username?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <span className="font-medium">
              {conversation.otherUser?.name || conversation.otherUser?.username || '未知用户'}
            </span>
          </Link>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              开始对话吧
            </div>
          ) : (
            conversation.messages.map((msg) => {
              const isMe = msg.senderId === (session.user as any).id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMe
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMe ? 'text-white/70' : 'text-gray-400'
                      }`}
                    >
                      {msg.createdAt
                        ? formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })
                        : '刚刚'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              disabled={sending}
            />
            <Button type="submit" disabled={!message.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
