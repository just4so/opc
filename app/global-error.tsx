'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ChunkLoadError: stale CDN cache referencing old JS chunks after deploy
    // Auto-reload silently resolves this for the user
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      window.location.reload()
      return
    }
  }, [error])

  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>出了点问题</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>页面加载时遇到了错误，请尝试刷新</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  )
}
