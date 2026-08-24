'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarEvent } from '@/lib/types'
import { useScrollLock } from '@/lib/useScrollLock'

const MONTHS_NL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
const MONTHS_SHORT: Record<number, string> = {1:'Jan',2:'Feb',3:'Mrt',4:'Apr',5:'Mei',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Okt',11:'Nov',12:'Dec'}
const WEEKDAYS = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag']
const WEEKDAYS_SHORT = ['zo','ma','di','wo','do','vr','za']

export function getEventDateDetails(event: CalendarEvent) {
  const [yy, mm, dd] = event.date.split('-').map(Number)
  const dStart = new Date(yy, (mm ?? 1) - 1, dd ?? 1)
  const wStart = WEEKDAYS[dStart.getDay()]
  const dayStart = dStart.getDate()
  const monthStart = MONTHS_NL[dStart.getMonth()]
  const yearStart = dStart.getFullYear()

  const isMultiDay = !!(event.datum_tot && event.datum_tot !== event.date)

  if (isMultiDay) {
    const [tY, tM, tD] = event.datum_tot!.split('-').map(Number)
    const dEnd = new Date(tY, (tM ?? 1) - 1, tD ?? 1)
    const wEnd = WEEKDAYS[dEnd.getDay()]
    const dayEnd = dEnd.getDate()
    const monthEnd = MONTHS_NL[dEnd.getMonth()]

    const parts = event.time ? event.time.split(/\s*[-–]\s*/) : []
    const tStart = parts[0]?.trim()
    const tEnd = parts[1]?.trim()

    const startLine = tStart ? `${tStart} ${wStart} ${dayStart} ${monthStart}` : `${wStart} ${dayStart} ${monthStart}`
    const endLine = tEnd ? `${tEnd} ${wEnd} ${dayEnd} ${monthEnd}` : `${wEnd} ${dayEnd} ${monthEnd}`

    const wStartShort = WEEKDAYS_SHORT[dStart.getDay()]
    const mStartShort = MONTHS_SHORT[dStart.getMonth() + 1]
    const wEndShort = WEEKDAYS_SHORT[dEnd.getDay()]
    const mEndShort = MONTHS_SHORT[dEnd.getMonth() + 1]

    const cardSummary = tStart && tEnd
      ? `${tStart} ${wStartShort} ${dayStart} ${mStartShort} - ${tEnd} ${wEndShort} ${dayEnd} ${mEndShort}`
      : `${wStartShort} ${dayStart} ${mStartShort} - ${wEndShort} ${dayEnd} ${mEndShort}`

    return {
      isMultiDay: true,
      startLine,
      endLine,
      cardSummary
    }
  }

  // Single day
  const singleDateStr = `${wStart} ${dayStart} ${monthStart} ${yearStart}`
  const cardSummary = `${wStart} ${dayStart} ${MONTHS_SHORT[dStart.getMonth() + 1]}`

  return {
    isMultiDay: false,
    singleDateStr,
    timeStr: event.time || null,
    cardSummary
  }
}

function googleCalUrl(event: CalendarEvent) {
  const d = event.date.replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Kriko-M | ${event.title}`)}&dates=${d}/${d}&details=${encodeURIComponent(event.description ?? '')}&location=${encodeURIComponent(event.location ?? '')}`
}

export function EventDetailDialog({ event, todayMs: _todayMs, onClose, onEdit, isPortal }: { event: CalendarEvent; todayMs?: number; onClose: () => void; onEdit?: () => void; isPortal?: boolean }) {
  const [mounted, setMounted] = useState(false)
  useScrollLock(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const dateInfo = getEventDateDetails(event)

  const titleColor = isPortal ? '#162544' : 'var(--color-primary-dark, #40050E)'
  const metaBg = isPortal ? '#EBF0F9' : '#FAF6EE'
  const metaBorder = isPortal ? '1.5px solid #D0DCEE' : '1.5px solid #EADECC'
  const metaIconColor = isPortal ? '#243B6B' : 'var(--color-primary, #650B19)'
  const metaTextColor = isPortal ? '#162544' : 'var(--color-primary-dark, #40050E)'

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        className="portaal-modal-overlay kalender-modal-overlay event-modal-overlay"
        style={{ position: 'fixed', inset: 0, background: 'rgba(10,0,5,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 3500 }}
        onClick={onClose}
      />
      <div className="portaal-modal-overlay kalender-modal-overlay event-modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3700, padding: '36px 16px', pointerEvents: 'none' }}>
        <div
          style={{ position: 'relative', pointerEvents: 'auto', background: '#fff', borderRadius: 22, boxShadow: '0 40px 100px rgba(58,7,16,0.26), 0 0 0 1px rgba(0,0,0,0.04)', width: '95%', maxWidth: 960, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Banner / Cover Image */}
          {event.banner_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.banner_image} alt={event.title} style={{ width: '100%', maxHeight: 290, objectFit: 'cover', borderRadius: '22px 22px 0 0', display: 'block' }} />
          )}

          <div className="cal-modal-content-inner">
            {/* Header: Title on left, Action Buttons on right (stacked on mobile) */}
            <div className={`cal-modal-title-wrap${onEdit ? ' has-edit' : ''}`}>
              <h3 className="cal-modal-title-heading" style={{ margin: 0, color: titleColor, fontSize: 'clamp(1.45rem, 5vw, 2.05rem)', fontWeight: 900, lineHeight: 1.22, fontFamily: 'var(--font-heading, Nunito, sans-serif)', wordBreak: 'break-word', flex: '1 1 auto', minWidth: 0 }}>
                {event.title}
              </h3>

              <div className="cal-modal-header-actions">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onEdit()
                    }}
                    style={{
                      height: 34,
                      padding: '0 15px',
                      borderRadius: 17,
                      border: 'none',
                      background: '#243B6B',
                      color: '#fff',
                      fontSize: '.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(36,59,107,0.2)',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-pen" style={{ fontSize: '.75rem' }}></i> Bewerken
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: 'none',
                    background: isPortal ? '#EBF0F9' : '#F0ECE4',
                    color: isPortal ? '#162544' : '#555',
                    fontSize: '.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  aria-label="Sluiten"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Key Details Meta Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: metaBg, border: metaBorder, borderRadius: 14, padding: '16px 20px' }}>
              {dateInfo.isMultiDay ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.95rem', color: metaTextColor }}>
                    <i className="fa-regular fa-calendar-check" style={{ color: metaIconColor, width: 16, textAlign: 'center' }}></i>
                    <span style={{ fontWeight: 700 }}>{dateInfo.startLine}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.95rem', color: metaTextColor }}>
                    <i className="fa-solid fa-flag-checkered" style={{ color: metaIconColor, width: 16, textAlign: 'center' }}></i>
                    <span style={{ fontWeight: 700 }}>{dateInfo.endLine}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.95rem', color: metaTextColor }}>
                    <i className="fa-regular fa-calendar" style={{ color: metaIconColor, width: 16, textAlign: 'center' }}></i>
                    <span style={{ fontWeight: 700 }}>{dateInfo.singleDateStr}</span>
                  </div>
                  {dateInfo.timeStr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.95rem', color: metaTextColor }}>
                      <i className="fa-regular fa-clock" style={{ color: metaIconColor, width: 16, textAlign: 'center' }}></i>
                      <span><strong>Tijdstip:</strong> {dateInfo.timeStr}</span>
                    </div>
                  )}
                </>
              )}
              {event.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.95rem', color: metaTextColor }}>
                  <i className="fa-solid fa-location-dot" style={{ color: metaIconColor, width: 16, textAlign: 'center' }}></i>
                  <span><strong>Locatie:</strong> {event.location}</span>
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            {(event.external_link_url || event.document_url || event.facebook_event_url) && (
              <div className="cal-modal-action-row">
                {event.external_link_url && (
                  <a
                    href={event.external_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary cal-modal-action-btn"
                  >
                    <i className="fa-solid fa-pen-to-square"></i> Inschrijven
                  </a>
                )}
                {event.document_url && (
                  <a
                    href={event.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline cal-modal-action-btn"
                  >
                    <i className="fa-solid fa-file-pdf" style={{ color: '#d32f2f' }}></i> Uitnodiging bekijken
                  </a>
                )}
                {event.facebook_event_url && (
                  <a
                    href={event.facebook_event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline cal-modal-action-btn cal-modal-btn-fb"
                  >
                    <i className="fa-brands fa-facebook"></i> Facebook Evenement
                  </a>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div style={{ background: '#fff', fontSize: '1.08rem', color: '#2B2B2B', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {event.description}
              </div>
            )}

            {/* Facebook Post Embed if present */}
            {event.facebook_post_url && (
              <div style={{ borderRadius: 12, border: '1px solid #ede9e1', overflow: 'hidden', background: '#f0f2f5' }}>
                <iframe
                  src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(event.facebook_post_url)}&show_text=true&width=750`}
                  width="750"
                  height="720"
                  style={{ border: 'none', display: 'block', width: '100%' }}
                  scrolling="no"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              </div>
            )}

            {/* Agenda Footer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid #ede9e1' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>
                  Zet in je agenda:
                </span>
                <a href={googleCalUrl(event)} className="cal-add-btn" target="_blank" rel="noopener noreferrer">
                  <i className="fa-brands fa-google"></i> Google
                </a>
                <button
                  type="button"
                  className="cal-add-btn"
                  onClick={() => { window.location.href = `webcal://${window.location.host}/api/kalender/ics?event=${event.id}` }}
                >
                  <i className="fa-brands fa-apple"></i> Apple
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function UpcomingEvent({
  event,
  todayMs,
  featured,
  compact,
  showBanner = true,
  showCountdown = true,
  showFooter = true,
  maxDescLines,
}: {
  event: CalendarEvent
  todayMs: number
  featured?: boolean
  compact?: boolean
  showBanner?: boolean
  showCountdown?: boolean
  showFooter?: boolean
  maxDescLines?: number
}) {
  const [open, setOpen] = useState(false)

  // Lokaal parsen
  const [yy, mm, dd] = event.date.split('-').map(Number)
  const d = new Date(yy, (mm ?? 1) - 1, dd ?? 1)
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS_SHORT[d.getMonth() + 1]

  const diff = Math.round((d.getTime() - todayMs) / 86400000)
  const countdown = diff === 0 ? 'Vandaag' : diff === 1 ? 'Morgen' : diff > 1 ? `${diff} dagen` : 'Afgelopen'
  const isNoMeeting = event.title.toLowerCase().includes('geen vergadering')

  const card = compact ? (
    <article
      className={`event-card-compact${(featured || event.is_evenement) ? ' event-card-compact--featured' : ''}${isNoMeeting ? ' event-card-compact--nomeeting' : ''}`}
      id={`event-${event.id}`}
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }}
    >
      <div className="event-card-compact-datebox">
        <span className="event-card-compact-day">{day}</span>
        <span className="event-card-compact-month">{month}</span>
      </div>
      <div className="event-card-compact-info">
        <div className="event-card-compact-header">
          <h4 className="event-card-compact-title" style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-primary-dark, #40050E)', lineHeight: 1.2 }}>{event.title}</h4>
          {showCountdown && (
            <span className={`event-card-compact-badge ${event.is_evenement ? 'badge-star' : isNoMeeting ? 'badge-neutral' : 'badge-primary'}`}>
              <i className="fa-regular fa-clock"></i> {countdown}
            </span>
          )}
        </div>
        {(event.time || event.location) && (
          <div className="event-card-compact-meta" style={{ marginTop: 2, fontSize: '.73rem', color: '#777', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {event.time && (
              <span>
                <i className="fa-regular fa-clock" style={{ fontSize: '.7rem', color: '#999', marginRight: 4 }}></i> {event.time}
              </span>
            )}
            {event.location && (
              <span>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '.7rem', color: '#999', marginRight: 4 }}></i> {event.location}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="event-card-compact-action" style={{ alignSelf: 'center', marginLeft: 'auto', flexShrink: 0, paddingLeft: 8 }}>
        <i className="fa-solid fa-chevron-right"></i>
      </div>
    </article>
  ) : (
    <article
      className={`event-card-v2${featured ? ' event-card-v2--hero' : ''}${event.is_evenement ? ' event-card-v2--featured' : ''}${isNoMeeting ? ' event-card-v2--nomeeting' : ''}`}
      id={`event-${event.id}`}
      data-date={event.date}
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }}
    >
      {showBanner && event.banner_image && (
        <div className="event-card-v2-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.banner_image} alt={event.title} />
        </div>
      )}

      <div className="event-card-v2-content">
        <div className="event-card-v2-top" style={{ alignItems: 'center' }}>
          <div className="event-card-v2-datebox" aria-hidden="true">
            <span className="event-card-v2-day">{day}</span>
            <span className="event-card-v2-month">{month}</span>
          </div>
          <div className="event-card-v2-header-info" style={{ justifyContent: 'center' }}>
            {showCountdown && (
              <div className="event-card-v2-header-top" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <span className={`event-card-v2-badge ${event.is_evenement ? 'badge-star' : isNoMeeting ? 'badge-neutral' : 'badge-primary'}`}>
                  <i className="fa-regular fa-clock"></i> {countdown}
                </span>
              </div>
            )}
            <h3 className="event-card-v2-title" style={{ fontSize: featured ? '1.24rem' : '1.18rem', fontWeight: 900, margin: 0, color: 'var(--color-primary-dark, #40050E)', lineHeight: 1.25 }}>{event.title}</h3>
          </div>
          {!showFooter && (
            <div className="event-card-compact-action" style={{ alignSelf: 'center', marginLeft: 'auto', flexShrink: 0, paddingLeft: 8 }}>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.95rem' }}></i>
            </div>
          )}
        </div>

        {((featured && event.time) || event.location) && (
          <div className="event-card-v2-meta" style={{ marginTop: 2, marginBottom: 6, fontSize: '.76rem', color: '#777', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {featured && event.time && (
              <span className="event-card-v2-meta-item" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i className="fa-regular fa-clock" style={{ fontSize: '.72rem', color: '#999', marginRight: 4 }}></i> {event.time}
              </span>
            )}
            {event.location && (
              <span className="event-card-v2-meta-item" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '.72rem', color: '#999', marginRight: 4 }}></i> {event.location}
              </span>
            )}
          </div>
        )}

        {event.description && (
          <p
            className="event-card-v2-desc"
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.5,
              color: '#555',
              marginTop: 2,
              marginBottom: showFooter ? undefined : 0,
              WebkitLineClamp: maxDescLines ?? ((showBanner && event.banner_image) ? 3 : 7),
            }}
          >
            {event.description}
          </p>
        )}

        {showFooter && (
          <div className="event-card-v2-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {event.external_link_url && (
                <span className="event-card-v2-btn-pill">
                  <i className="fa-solid fa-pen-to-square"></i> Inschrijven
                </span>
              )}
              {event.document_url && (
                <span className="event-card-v2-btn-pill">
                  <i className="fa-solid fa-file-pdf"></i> Uitnodiging
                </span>
              )}
            </div>
            <span style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', padding: '6px 2px' }}>
              <i className="fa-solid fa-chevron-right"></i>
            </span>
          </div>
        )}
      </div>
    </article>
  )

  return (
    <>
      {card}
      {open && <EventDetailDialog event={event} todayMs={todayMs} onClose={() => setOpen(false)} />}
    </>
  )
}

