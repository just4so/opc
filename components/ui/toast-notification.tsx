'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-600 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-600 shrink-0" />,
  }

  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-slide-in pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${bgColors[t.type]}`}
          >
            {icons[t.type]}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
