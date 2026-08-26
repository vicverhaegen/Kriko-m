'use client'

import { useState, useEffect, ReactNode } from 'react'

interface ProtectedEmailProps {
  email?: string
  showCopy?: boolean
  showMailto?: boolean
  variant?: 'inline' | 'button' | 'link'
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export default function ProtectedEmail({
  email = 'groepsleiding@kriko-m.be',
  showCopy = false,
  showMailto = true,
  variant,
  className,
  style,
  children,
}: ProtectedEmailProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(email)
      } else {
        const ta = document.createElement('textarea')
        ta.value = email
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  // Pre-hydration (SSR): Render reversed text with bidi-override so raw regex scanners see nonsense domain
  if (!mounted) {
    const reversed = email.split('').reverse().join('')
    return (
      <span
        className={className}
        style={{
          unicodeBidi: 'bidi-override',
          direction: 'rtl',
          ...style,
        }}
        aria-hidden="true"
      >
        {reversed}
      </span>
    )
  }

  const isButton = variant === 'button' || showCopy

  if (isButton) {
    return (
      <button
        onClick={handleCopy}
        type="button"
        className={className ?? 'btn btn-secondary'}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
          ...style,
        }}
        title="Klik om te kopiëren"
      >
        {copied ? (
          <>
            <i className="fa-solid fa-check" style={{ color: '#22c55e' }}></i>
            <span>Gekopieerd!</span>
          </>
        ) : (
          <>
            {children || (
              <>
                <span>{email}</span>
                <i className="fa-regular fa-copy" style={{ fontSize: '0.85em', opacity: 0.7 }}></i>
              </>
            )}
          </>
        )}
      </button>
    )
  }

  if (showMailto) {
    return (
      <a
        href={`mailto:${email}`}
        className={className}
        style={{
          color: 'var(--color-primary)',
          fontWeight: 700,
          textDecoration: 'underline',
          ...style,
        }}
      >
        {children || email}
      </a>
    )
  }

  return (
    <span className={className} style={style}>
      {children || email}
    </span>
  )
}
