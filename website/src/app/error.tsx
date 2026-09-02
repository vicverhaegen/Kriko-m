'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Next.js error caught by boundary:', error)
  }, [error])

  return (
    <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <section className="section container" style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🧭</div>
        
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-primary-dark, #3a0710)', marginBottom: 16, fontWeight: 900, fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
          Verbinding even onderbroken
        </h1>
        
        <p style={{ color: 'var(--color-text-muted, #64748B)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 32 }}>
          We konden de nodige gegevens niet ophalen. Dit gebeurt meestal door een trage of wegvallende mobiele internetverbinding.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
            Opnieuw proberen
          </button>
          
          <Link href="/" className="btn btn-outline">
            Terug naar home
          </Link>
        </div>
      </section>
    </main>
  )
}
