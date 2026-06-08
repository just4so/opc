'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ChunkLoadError: stale CDN cache referencing old JS chunks after deploy
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      window.location.reload()
      return
    }
    // Log other errors for debugging
    console.error('[Error Boundary]', error)
  }, [error])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '50vh',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>页面加载出错</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
        请尝试刷新页面，如果问题持续请联系我们
      </p>
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
        重试
      </button>
    </div>
  )
}
