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
    console.error('Root error caught by global boundary:', error)
  }, [error])

  return (
    <html lang="nl">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F0ECE4', color: '#162544', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 500, margin: '20px', padding: '40px 30px', background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🧭</div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 12px', color: '#650B19', fontWeight: 800 }}>
            Verbinding verbroken
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 28px' }}>
            Er kon geen verbinding gemaakt worden met de server. Controleer je internetverbinding en probeer het opnieuw.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#650B19',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Opnieuw proberen
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'transparent',
                color: '#650B19',
                border: '1.5px solid #650B19',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Naar startpagina
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
