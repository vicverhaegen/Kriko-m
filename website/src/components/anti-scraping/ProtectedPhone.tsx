'use client'

import { useState, useEffect, ReactNode } from 'react'

interface ProtectedPhoneProps {
  phone: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export default function ProtectedPhone({
  phone,
  className,
  style,
  children,
}: ProtectedPhoneProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!phone) return null

  // Pre-hydration (SSR): Render reversed text without tel: link
  if (!mounted) {
    const reversed = phone.split('').reverse().join('')
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

  const cleanPhone = phone.replace(/\s+/g, '')

  return (
    <a
      href={`tel:${cleanPhone}`}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.86rem',
        fontWeight: 700,
        color: 'var(--color-primary)',
        backgroundColor: '#fff',
        padding: '6px 12px',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--color-border)',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <i className="fa-solid fa-phone" style={{ color: 'var(--color-primary)', fontSize: '0.85em' }}></i>
      {children || phone}
    </a>
  )
}
