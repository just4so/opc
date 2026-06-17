'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

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
  const { status } = useSession()

  const failCountRef = { current: 0 }

  const fetchCounts = useCallback(async () => {
    if (status !== 'authenticated') return

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch('/api/unread-summary', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        setCounts({ notifications: data.notifications || 0, messages: data.messages || 0 })
        failCountRef.current = 0
      } else {
        failCountRef.current++
      }
    } catch (err) {
      clearTimeout(timeoutId)
      // AbortError = timeout, silent degradation
      if ((err as Error).name !== 'AbortError') {
        failCountRef.current++
      }
    }
  }, [status])

  useEffect(() => {
    fetchCounts()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

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
