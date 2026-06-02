'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface UnreadCounts {
  notifications: number
  messages: number
}

const UnreadContext = createContext<{
  counts: UnreadCounts
  refresh: () => void
}>({
  counts: { notifications: 0, messages: 0 },
  refresh: () => {},
})

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<UnreadCounts>({ notifications: 0, messages: 0 })

  const failCountRef = { current: 0 }

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/unread-summary')
      if (res.ok) {
        const data = await res.json()
        setCounts({ notifications: data.notifications || 0, messages: data.messages || 0 })
        failCountRef.current = 0
      } else {
        failCountRef.current++
      }
    } catch {
      failCountRef.current++
    }
  }, [])

  useEffect(() => {
    fetchCounts()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // 连续失败 3 次后降级为 5 分钟轮询，避免在网络不稳定时频繁请求
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && failCountRef.current < 3) {
        fetchCounts()
      }
    }, 60000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchCounts])

  return (
    <UnreadContext.Provider value={{ counts, refresh: fetchCounts }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread() {
  return useContext(UnreadContext)
}
