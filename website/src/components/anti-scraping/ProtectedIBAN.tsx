'use client'

import { useState } from 'react'

interface ProtectedIBANProps {
  iban?: string
  displayIban?: string
  className?: string
  buttonStyle?: React.CSSProperties
}

export default function ProtectedIBAN({
  iban = 'BE59736064132626',
  displayIban: _displayIban = 'BE59 7360 6413 2626',
  className,
  buttonStyle,
}: ProtectedIBANProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(iban.replace(/\s+/g, ''))
      } else {
        const ta = document.createElement('textarea')
        ta.value = iban.replace(/\s+/g, '')
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

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={className ?? 'btn btn-secondary'}
      style={{
        cursor: 'pointer',
        padding: '10px 20px',
        fontSize: '0.92rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s ease',
        ...buttonStyle,
      }}
      title="Klik om IBAN te kopiëren"
    >
      {copied ? (
        <>
          <i className="fa-solid fa-check" style={{ color: '#22c55e' }}></i>
          <span>Gekopieerd!</span>
        </>
      ) : (
        <>
          <i className="fa-regular fa-copy"></i>
          <span>Kopieer IBAN</span>
        </>
      )}
    </button>
  )
}
