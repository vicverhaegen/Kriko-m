'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from '@/lib/useScrollLock'

interface SubscribeCalendarButtonProps {
  feedPath?: string
  calendarName?: string
  buttonClassName?: string
  buttonText?: string
  buttonStyle?: React.CSSProperties
}

export default function SubscribeCalendarButton({
  feedPath = '/api/kalender/ics',
  calendarName = 'Scouts Kriko-M',
  buttonClassName = 'btn btn-secondary cal-actions-btn',
  buttonText = 'Abonneer op onze agenda',
  buttonStyle,
}: SubscribeCalendarButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')
  const [mounted, setMounted] = useState(false)

  useScrollLock(open)

  useEffect(() => {
    setMounted(true)
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kriko-m.be'
    setOrigin(isLocal ? publicOrigin : window.location.origin)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const feedUrl = `${origin}${feedPath}`
  const webcalUrl = feedUrl.replace(/^https?:/, 'webcal:')
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`
  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?rru=addsubscription&url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent(calendarName)}`
  const downloadUrl = `${feedUrl}${feedPath.includes('?') ? '&' : '?'}download=1`

  const handleCopy = () => {
    navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modal = open && mounted ? (
    <div
      className="cal-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,0,5,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cal-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          position: 'relative',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          className="cal-modal-close"
          aria-label="Sluiten"
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="cal-modal-body" style={{ padding: '28px 24px' }}>
          <span className="cal-modal-eyebrow" style={{ color: '#243B6B', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            <i className="fa-solid fa-calendar-days"></i> Kalender koppelen
          </span>
          <h3 className="cal-modal-title" style={{ color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', fontWeight: 900, fontSize: '1.45rem', marginTop: 0, marginBottom: 8 }}>
            Abonneer op de agenda
          </h3>
          <p className="cal-modal-desc" style={{ fontSize: '0.92rem', marginBottom: '22px', color: '#555', lineHeight: 1.5 }}>
            Koppel de agenda van {calendarName} aan jouw persoonlijke agenda-app. Nieuwe activiteiten en wijzigingen worden dan automatisch gesynchroniseerd!
          </p>

          <div className="cal-sub-grid">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline cal-sub-btn" style={{ borderColor: '#D0DCEE', borderRadius: 10 }}>
              <i className="fa-brands fa-google" style={{ color: '#4285F4' }}></i> Google Agenda
            </a>
            <a href={webcalUrl} className="btn btn-outline cal-sub-btn" style={{ borderColor: '#D0DCEE', borderRadius: 10 }}>
              <i className="fa-brands fa-apple" style={{ color: '#000' }}></i> Apple / Outlook
            </a>
            <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline cal-sub-btn" style={{ borderColor: '#D0DCEE', borderRadius: 10 }}>
              <i className="fa-brands fa-microsoft" style={{ color: '#0078D4' }}></i> Outlook Web
            </a>
            <a href={downloadUrl} className="btn btn-outline cal-sub-btn" style={{ borderColor: '#D0DCEE', borderRadius: 10 }}>
              <i className="fa-solid fa-download"></i> Download .ics
            </a>
          </div>

          <div className="cal-sub-divider">
            <label className="cal-sub-copy-title" style={{ color: '#162544' }}>Handmatige link (URL kopiëren):</label>
            <div className="cal-sub-copy-box">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="cal-sub-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap',
                  background: '#243B6B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {copied ? '✓ Gekopieerd!' : 'Kopieer link'}
              </button>
            </div>
            <p className="cal-sub-info-text">
              Gebruik je een andere agenda-app (zoals Thunderbird of Yahoo)? Kopieer de bovenstaande link en voeg deze toe onder de optie &ldquo;Nieuw agenda-abonnement&rdquo; of &ldquo;Toevoegen via URL&rdquo;.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClassName} style={buttonStyle}>
        <i className="fa-regular fa-calendar-plus"></i> {buttonText}
      </button>

      {mounted && typeof document !== 'undefined' && modal ? createPortal(modal, document.body) : null}
    </>
  )
}
