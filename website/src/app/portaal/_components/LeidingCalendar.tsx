'use client'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarEvent, AudienceTag } from '@/lib/types'
import { AUDIENCE_TAGS, AUDIENCE_NAMEN, PORTAAL_AUDIENCE_KLEUREN } from '@/lib/constants'
import { getEventIcon, getPrimaryAudienceTag } from '@/lib/calendar'
import SubscribeCalendarButton from '@/components/SubscribeCalendarButton'
import ConfirmDialog from './ConfirmDialog'
import KalenderActiviteitModal from './KalenderActiviteitModal'
import { EventDetailDialog } from '@/components/EventDetailModal'

const MAANDEN = ['', 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
const MAANDEN_KORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
const DAG_LETTERS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface Props {
  initialCalendar: CalendarEvent[]
  highlightTak?: string
  canPublish: boolean
  isGroepsleiding?: boolean
  icsToken: string
  readOnly?: boolean
  twoColumn?: boolean
}

// Monday-first: returns 0=Mon … 6=Sun
function dayOfWeekMon(d: Date): number {
  return (d.getDay() + 6) % 7
}

// Use local time to avoid UTC offset shifting the date string by one day (e.g. UTC+2 midnight → previous UTC day)
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function LeidingCalendar({ initialCalendar, highlightTak, canPublish, isGroepsleiding = false, icsToken, readOnly, twoColumn = false }: Props) {
  const today = new Date()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<CalendarEvent[]>(initialCalendar)
  const [filter, setFilter] = useState<Set<string>>(() => {
    const tag = searchParams.get('filter')
    return tag && AUDIENCE_TAGS.includes(tag as AudienceTag) ? new Set([tag]) : new Set()
  })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [activeViewEvent, setActiveViewEvent] = useState<CalendarEvent | null>(null)
  const [flash, setFlash] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)

  // Calendar grid state
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const layoutRef = useRef<HTMLDivElement | null>(null)
  const rightColumnRef = useRef<HTMLDivElement | null>(null)
  const targetScrollRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!twoColumn) return
    const layout = layoutRef.current
    if (!layout) return

    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth <= 1024) return
      const target = rightColumnRef.current
      if (!target) return

      // Don't scroll background if a modal is open
      if (showForm || activeViewEvent || confirmDialog) return

      let delta = e.deltaY
      if (e.deltaMode === 1) {
        delta *= 33
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight
      }

      const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight)
      if (maxScroll <= 0) return

      // Prevent native discontinuous scroll so the entire page shares the identical smooth momentum scroll
      e.preventDefault()

      const currentScroll = target.scrollTop

      if (animFrameRef.current === null) {
        targetScrollRef.current = currentScroll
      } else {
        const currentDiff = targetScrollRef.current - currentScroll
        if ((delta > 0 && currentDiff < -10) || (delta < 0 && currentDiff > 10)) {
          targetScrollRef.current = currentScroll
        }
      }

      targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current + delta))

      if (animFrameRef.current === null) {
        const animate = () => {
          const col = rightColumnRef.current
          if (!col) {
            animFrameRef.current = null
            return
          }
          const current = col.scrollTop
          const dest = targetScrollRef.current
          const diff = dest - current

          if (Math.abs(diff) < 0.5) {
            col.scrollTop = dest
            animFrameRef.current = null
            return
          }

          col.scrollTop = current + diff * 0.16
          animFrameRef.current = requestAnimationFrame(animate)
        }
        animFrameRef.current = requestAnimationFrame(animate)
      }
    }

    const handlePointerDown = () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      if (rightColumnRef.current) {
        targetScrollRef.current = rightColumnRef.current.scrollTop
      }
    }

    layout.addEventListener('wheel', handleWheel, { passive: false })
    layout.addEventListener('pointerdown', handlePointerDown)

    return () => {
      layout.removeEventListener('wheel', handleWheel)
      layout.removeEventListener('pointerdown', handlePointerDown)
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [twoColumn, showForm, activeViewEvent, confirmDialog])



  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const entries: CalendarEvent[] = useMemo(() => {
    if (filter.size === 0) return events
    return events.filter(e => e.audience.some(a => filter.has(a)))
  }, [events, filter])

  // Map date string → entries for that day (for calendar dots)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of entries) {
      const key = e.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
      // Also fill intermediate days for multi-day events
      if (e.datum_tot && e.datum_tot !== e.date) {
        const start = new Date(e.date)
        const end = new Date(e.datum_tot)
        const cur = new Date(start)
        cur.setDate(cur.getDate() + 1)
        while (cur <= end) {
          const k = cur.toISOString().slice(0, 10)
          if (!map.has(k)) map.set(k, [])
          map.get(k)!.push(e)
          cur.setDate(cur.getDate() + 1)
        }
      }
    }
    return map
  }, [entries])

  const todayDate = toLocalDateStr(new Date())

  // Right column: only upcoming when no day selected; all entries for a selected day
  const rightEntries = useMemo(() => {
    if (selectedDate) {
      return entries.filter(e => {
        if (e.date === selectedDate) return true
        if (e.datum_tot && e.datum_tot >= selectedDate && e.date <= selectedDate) return true
        return false
      })
    }
    return entries.filter(e => (e.datum_tot ?? e.date) >= todayDate)
  }, [entries, selectedDate, todayDate])

  // Calendar grid computation
  const calGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const startOffset = dayOfWeekMon(firstDay)
    const cells: Array<{ date: Date | null; key: string }> = []
    // leading empty cells
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(calYear, calMonth, 1 - (startOffset - i))
      cells.push({ date: d, key: `prev-${i}` })
    }
    // days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({ date: new Date(calYear, calMonth, d), key: `${calYear}-${calMonth}-${d}` })
    }
    // trailing empty cells to complete the grid (dynamically 4, 5, or 6 weeks depending on month)
    const targetLength = Math.ceil(cells.length / 7) * 7
    const remaining = targetLength - cells.length
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(calYear, calMonth + 1, i), key: `next-${i}` })
    }
    return cells
  }, [calYear, calMonth])

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null)
  }
  function goToToday() {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDate(null)
  }

  function toggleFilter(tag: string) {
    setFilter(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag); else next.add(tag)
      return next
    })
  }

  function closeModal() { setEditId(null); setShowForm(false) }

  function TagChips({ tags, compact = false }: { tags: AudienceTag[]; compact?: boolean }) {
    return (
      <span className="cal-tag-chips-wrap">
        {tags.map(t => {
          const isYellow = t === 'kapoenen'
          const tagBg = PORTAAL_AUDIENCE_KLEUREN[t] || '#243B6B'
          const tagColor = isYellow ? '#3A2A00' : '#FFFFFF'
          return (
            <span key={t} style={{
              padding: compact ? '2px 8px' : '3px 10px',
              borderRadius: 20,
              fontSize: compact ? '9.5px' : '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              background: tagBg,
              color: tagColor,
              border: 'none',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}>
              {AUDIENCE_NAMEN[t]}
            </span>
          )
        })}
      </span>
    )
  }

  // ─── Calendar Grid Component ───────────────────────────────────────────────
  function CalendarGrid() {
    const todayStr = toLocalDateStr(today)
    const numWeeks = Math.ceil(calGrid.length / 7)
    const cardHeightStyle = numWeeks < 6
      ? `calc((100% - 70px) * ${numWeeks} / 6 + 70px)`
      : '100%'

    return (
      <div
        className="portal-cal-grid-card"
        style={{ '--cal-card-height': cardHeightStyle } as React.CSSProperties}
      >
        {/* Bordeaux header bar */}
        <div className="portal-cal-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#243B6B', color: '#fff', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <h2 className="cal-grid-month-title" style={{ color: '#fff', fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)', margin: 0, fontWeight: 800, fontFamily: 'var(--font-heading, Nunito, sans-serif)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-regular fa-calendar-days" style={{ fontSize: '1.05rem' }}></i> {MAANDEN[calMonth + 1]} {calYear}
            </h2>
          </div>

          <div className="cal-grid-nav" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="cal-grid-nav-btn"
              onClick={prevMonth}
              aria-label="Vorige maand"
              title="Vorige maand"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              className="cal-grid-today-btn"
              onClick={goToToday}
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Vandaag
            </button>
            <button
              type="button"
              className="cal-grid-nav-btn"
              onClick={nextMonth}
              aria-label="Volgende maand"
              title="Volgende maand"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="portal-cal-grid-weekdays">
          {DAG_LETTERS.map(d => (
            <div key={d} className="portal-cal-grid-weekday">
              {d}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="portal-cal-grid-days">
          {calGrid.map((cell) => {
            const isCurrentMonth = cell.date!.getMonth() === calMonth
            const dateStr = toLocalDateStr(cell.date!)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dayEvents = eventsByDate.get(dateStr) || []
            const hasEvents = dayEvents.length > 0

            return (
              <div
                key={cell.key}
                className={`portal-cal-grid-cell ${
                  !isCurrentMonth ? 'portal-cal-grid-cell--out' : ''
                } ${isToday ? 'portal-cal-grid-cell--today' : ''} ${
                  isSelected ? 'portal-cal-grid-cell--selected' : ''
                } ${hasEvents ? 'portal-cal-grid-cell--has-events' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDate(prev => prev === dateStr ? null : dateStr)
                }}
              >
                <div className="portal-cal-grid-cell-top">
                  <span className="portal-cal-grid-day-number">{cell.date!.getDate()}</span>
                  {isToday && <span className="portal-cal-grid-today-tag">Vandaag</span>}
                </div>

                {/* Render event pills & micro-dots inside cell */}
                {hasEvents && (
                  <div className="portal-cal-grid-cell-events">
                    {/* Compact dots visible on narrow mobile screens (<= 480px) */}
                    <div className="portal-cal-mobile-dots">
                      {dayEvents.slice(0, 3).map(ev => {
                        const primaryTag = getPrimaryAudienceTag(ev.audience)
                        const tagColor = PORTAAL_AUDIENCE_KLEUREN[primaryTag] || '#243B6B'
                        return (
                          <span
                            key={ev.id}
                            className="portal-cal-dot"
                            style={{ backgroundColor: tagColor }}
                            title={ev.title}
                          />
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <span className="portal-cal-more-dots">+{dayEvents.length - 3}</span>
                      )}
                    </div>

                    {/* Standard pills (desktop and medium mobile) */}
                    <div className="portal-cal-pills-list">
                      {dayEvents.map(ev => {
                        const primaryTag = getPrimaryAudienceTag(ev.audience)
                        const isNoMeeting = ev.title.toLowerCase().includes('geen vergadering')
                        const iconClass = getEventIcon(ev)
                        const tagColor = PORTAAL_AUDIENCE_KLEUREN[primaryTag] || '#243B6B'
                        const isYellow = primaryTag === 'kapoenen'

                        let pillStyle: React.CSSProperties = {}

                        if (isNoMeeting) {
                          pillStyle = {
                            background: '#64748B',
                            color: '#FFFFFF',
                            border: '1px solid #64748B',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                          }
                        } else {
                          pillStyle = {
                            background: tagColor,
                            color: isYellow ? '#3A2A00' : '#FFFFFF',
                            border: `1px solid ${tagColor}`,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                          }
                        }

                        if (!isCurrentMonth) {
                          pillStyle = {
                            ...pillStyle,
                            opacity: 0.75,
                            filter: 'grayscale(0.35)'
                          }
                        }

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            className="portal-cal-event-pill"
                            style={pillStyle}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveViewEvent(ev)
                            }}
                            title={`${ev.title} (${ev.time || 'Hele dag'})`}
                          >
                            {iconClass ? <i className={`fa-solid ${iconClass} portal-pill-icon`} /> : null}
                            <span className="portal-cal-event-pill-title">{ev.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Date box widget (left column of each activity card) ─────────────────
  interface DateBoxStyle {
    bg: string
    border: string
    dayColor: string
    monthColor: string
  }

  function getDateBoxStyles(tag: AudienceTag): DateBoxStyle {
    switch (tag) {
      case 'kapoenen':
        return { bg: '#F4C842', border: 'none', dayColor: '#3A2A00', monthColor: '#473400' }
      case 'welpen':
        return { bg: '#2E8B3A', border: 'none', dayColor: '#FFFFFF', monthColor: '#EBF5EE' }
      case 'jonggivers':
        return { bg: '#D96800', border: 'none', dayColor: '#FFFFFF', monthColor: '#FDF0E4' }
      case 'givers':
        return { bg: '#1A3FB5', border: 'none', dayColor: '#FFFFFF', monthColor: '#EEF2FC' }
      case 'groep':
        return { bg: '#85172A', border: 'none', dayColor: '#FFFFFF', monthColor: '#F9EBEF' }
      case 'grl':
        return { bg: '#1E7E52', border: 'none', dayColor: '#FFFFFF', monthColor: '#E6F4ED' }
      case 'leiding':
      default:
        return { bg: '#2B4C8C', border: 'none', dayColor: '#FFFFFF', monthColor: '#EBF0F9' }
    }
  }

  function DateBox({
    date,
    datumTot,
    tag = 'leiding',
  }: {
    date: string
    datumTot?: string
    isImportant?: boolean
    tag?: AudienceTag
  }) {
    const start = new Date(date)
    const startDay = start.getDate()
    const startMaand = MAANDEN_KORT[start.getMonth()].toLowerCase()
    const isMultiDay = !!datumTot && datumTot !== date

    const end = isMultiDay ? new Date(datumTot!) : null
    const sameMonth = end ? (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) : true

    const { bg, border, dayColor, monthColor } = getDateBoxStyles(tag)

    const boxStyle: React.CSSProperties = {
      flexShrink: 0,
      width: isMultiDay && !sameMonth ? 62 : 54,
      minHeight: 52,
      background: bg,
      borderRadius: 12,
      border: border && border !== 'none' ? `1.5px solid ${border}` : 'none',
      padding: '6px 4px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      boxSizing: 'border-box',
    }

    if (!isMultiDay) {
      return (
        <div style={boxStyle}>
          <span style={{ fontSize: 20, fontWeight: 900, color: dayColor, lineHeight: 1 }}>
            {String(startDay).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: monthColor, lineHeight: 1, textTransform: 'lowercase' }}>{startMaand}</span>
        </div>
      )
    }

    const endDay = end!.getDate()
    const endMaand = MAANDEN_KORT[end!.getMonth()].toLowerCase()

    return (
      <div style={boxStyle}>
        {sameMonth ? (
          <>
            <span style={{ fontSize: 15, fontWeight: 900, color: dayColor, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              {startDay}–{endDay}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: monthColor, lineHeight: 1, textTransform: 'lowercase' }}>{startMaand}</span>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: dayColor, lineHeight: 1.15, whiteSpace: 'nowrap' }}>
              {startDay} {startMaand}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: dayColor, lineHeight: 1.15, whiteSpace: 'nowrap' }}>
              – {endDay} {endMaand}
            </span>
          </div>
        )}
      </div>
    )
  }

  // ─── Activity list (right column or standalone) ───────────────────────────
  function ActivityList({ listEntries }: { listEntries: CalendarEvent[] }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {listEntries.length === 0 && (
          <p style={{ color: '#666666', fontSize: '.9rem', textAlign: 'center', padding: '32px 0', background: '#fff', borderRadius: 14, border: '1px solid #D9D9D9' }}>
            {selectedDate ? 'Geen activiteiten op deze dag.' : 'Geen activiteiten gevonden.'}
          </p>
        )}
        {listEntries.map(ev => {
          const primaryTag = getPrimaryAudienceTag(ev.audience) as AudienceTag
          const highlighted = highlightTak ? ev.audience.includes(highlightTak as AudienceTag) : false
          const isMultiDay = !!ev.datum_tot && ev.datum_tot !== ev.date
          const iconClass = getEventIcon(ev)

          return (
            <div
              key={ev.id}
              className={`portal-activity-card${highlighted ? ' highlighted' : ''}`}
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                border: highlighted ? '2px solid #C9963A' : '1px solid #D9D9D9',
                boxShadow: highlighted ? '0 4px 14px rgba(201,150,58,.22)' : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
              onClick={() => setActiveViewEvent(ev)}
            >
              <div className="portal-activity-card-inner" style={{ minWidth: 0, width: '100%' }}>
                <DateBox date={ev.date} datumTot={ev.datum_tot || undefined} tag={primaryTag} />
                
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <strong style={{
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: '#162544',
                    fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    lineHeight: 1.25,
                    minWidth: 0,
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}>
                    {iconClass ? <i className={`fa-solid ${iconClass}`} style={{ color: '#2B4C8C', fontSize: '1.05rem', flexShrink: 0 }}></i> : null}
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0 }}>{ev.title}</span>
                  </strong>
                  {((!isMultiDay && ev.time) || ev.location) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3, fontSize: '.78rem', color: '#666666', fontWeight: 600, flexWrap: 'wrap' }}>
                      {!isMultiDay && ev.time && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          <i className="fa-regular fa-clock" style={{ fontSize: '.72rem', color: '#2B4C8C' }}></i> {ev.time}
                        </span>
                      )}
                      {ev.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, wordBreak: 'break-word' }}>
                          <i className="fa-solid fa-location-dot" style={{ fontSize: '.72rem', color: '#2B4C8C' }}></i> {ev.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="portal-activity-card-actions" style={{ minWidth: 0 }}>
                  <TagChips tags={ev.audience} compact />
                  <span style={{ fontSize: '.85rem', color: '#2B4C8C', fontWeight: 800 }}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  function FilterBar() {
    const mainTags = isGroepsleiding || canPublish
      ? (['groep', 'leiding', 'grl'] as const)
      : (['groep', 'leiding'] as const)

    return (
      <div className="cal-filter-bar-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16, minHeight: 34, flexWrap: 'wrap' }}>
        <div className="cal-filter-tags-scroll-row" style={{ display: 'flex', gap: 5, alignItems: 'center', overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          {mainTags.map(tag => {
            const isActive = filter.has(tag)
            const tagColor = PORTAAL_AUDIENCE_KLEUREN[tag]
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFilter(tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1.5px solid ${tagColor}`,
                  cursor: 'pointer',
                  fontSize: '.74rem',
                  fontWeight: 800,
                  background: isActive ? tagColor : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : tagColor,
                  boxShadow: isActive ? '0 3px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {AUDIENCE_NAMEN[tag]}
              </button>
            )
          })}
          <span style={{ width: 1, height: 16, background: 'rgba(22,37,68,0.25)', alignSelf: 'center', margin: '0 2px', flexShrink: 0 }} />
          {(['kapoenen', 'welpen', 'jonggivers', 'givers'] as const).map(tag => {
            const isActive = filter.has(tag)
            const tagColor = PORTAAL_AUDIENCE_KLEUREN[tag]
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFilter(tag)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 20,
                  border: `1.5px solid ${tagColor}`,
                  cursor: 'pointer',
                  fontSize: '.74rem',
                  fontWeight: 800,
                  background: isActive ? tagColor : '#FFFFFF',
                  color: isActive ? (tag === 'kapoenen' ? '#3a2a00' : '#FFFFFF') : tagColor,
                  boxShadow: isActive ? '0 3px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {AUDIENCE_NAMEN[tag]}
              </button>
            )
          })}
          {filter.size > 0 && (
            <button
              onClick={() => setFilter(new Set())}
              style={{
                padding: '4px 9px',
                borderRadius: 20,
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
                fontSize: '.72rem',
                fontWeight: 800,
                color: '#64748B',
                background: '#FFFFFF',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ✕ Wis
            </button>
          )}
        </div>
        <SubscribeCalendarButton
          feedPath={isGroepsleiding ? `/api/groepsleiding/ics/${icsToken}` : `/api/leiding/ics/${icsToken}`}
          calendarName={isGroepsleiding ? "Groeps Kriko-m" : "Leiding Kriko-m"}
          buttonText="Abonneer"
          buttonClassName=""
          buttonStyle={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#243B6B', border: 'none', borderRadius: 10, color: '#FFFFFF', fontSize: '.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(36,59,107,0.2)', flexShrink: 0, whiteSpace: 'nowrap' }}
        />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="portal-agenda-container-root">
      {flash && !showForm && (
        <div style={{ background: '#FFFFFF', border: '1px solid #243B6B', color: '#243B6B', padding: '12px 18px', borderRadius: 12, marginBottom: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(107,23,36,0.1)', flexShrink: 0 }}>
          {flash}
        </div>
      )}

      {twoColumn ? (
        // Two-column: filter bar + calendar grid left (sticky), activity list right
        <div className="portal-agenda-layout" ref={layoutRef}>
          {/* Left: filter bar + calendar grid */}
          <div className="portal-agenda-left-column">
            {FilterBar()}
            {selectedDate && (
              <div style={{ marginBottom: 12, padding: '8px 14px', background: '#EBF0F9', border: '1.5px solid #D0DCEE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '.84rem', fontWeight: 800, color: '#162544' }}>
                  Geselecteerde dag: {(() => { const d = new Date(selectedDate); return `${d.getDate()} ${MAANDEN[d.getMonth() + 1]} ${d.getFullYear()}` })()}
                </span>
                <button onClick={() => setSelectedDate(null)} style={{ background: '#243B6B', border: 'none', borderRadius: 6, color: '#FFFFFF', cursor: 'pointer', fontSize: '.76rem', fontWeight: 700, padding: '4px 12px' }}>
                  Alle tonen
                </button>
              </div>
            )}
            <div className="portal-cal-card-wrapper">
              {CalendarGrid()}
            </div>
          </div>

          {/* Right: activity list */}
          <div className="portal-agenda-right-column" ref={rightColumnRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 34, gap: 8, flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#162544', margin: 0, fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                {selectedDate ? 'Activiteiten op deze dag' : 'Activiteiten'}
              </h3>
              {!readOnly && !showForm && (
                <button onClick={() => { setEditId(null); setShowForm(true) }}
                  style={{ padding: '8px 16px', background: '#243B6B', color: '#FFFFFF', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, fontSize: '.84rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(36,59,107,0.3)' }}>
                  + Activiteit toevoegen
                </button>
              )}
            </div>
            <div className="portal-agenda-right-list">
              {ActivityList({ listEntries: rightEntries })}
            </div>
          </div>
        </div>
      ) : (
        // Single-column layout (dashboard widget etc.)
        <div>
          {FilterBar()}
          {!readOnly && (
            <button onClick={() => { setEditId(null); setShowForm(true) }}
              style={{ marginBottom: 16, padding: '9px 18px', background: '#243B6B', color: '#FFFFFF', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>
              + Activiteit toevoegen
            </button>
          )}
          {ActivityList({ listEntries: entries })}
        </div>
      )}

      {!readOnly && showForm && (
        <KalenderActiviteitModal
          canPublish={canPublish}
          initialAudience={!editId && highlightTak && AUDIENCE_TAGS.includes(highlightTak as AudienceTag) ? [highlightTak as AudienceTag] : []}
          editEvent={editId ? events.find(e => e.id === editId) : undefined}
          onClose={closeModal}
          onSaved={(saved, isNew) => {
            setEvents(prev => {
              const next = isNew ? [...prev, saved] : prev.map(e => e.id === editId ? saved : e)
              return next.sort((a, b) => a.date.localeCompare(b.date))
            })
            showFlash(isNew ? 'Activiteit toegevoegd!' : 'Activiteit bijgewerkt!')
            closeModal()
          }}
          onDeleted={(id) => {
            setEvents(prev => prev.filter(e => e.id !== id))
            showFlash('Activiteit verwijderd.')
            closeModal()
          }}
        />
      )}
      {activeViewEvent && (
        <EventDetailDialog
          event={activeViewEvent}
          todayMs={today.getTime()}
          isPortal={true}
          onClose={() => setActiveViewEvent(null)}
          onEdit={
            !readOnly && !(canPublish ? false : (activeViewEvent.audience.includes('groep') || activeViewEvent.audience.includes('grl')))
              ? () => {
                  setEditId(activeViewEvent.id)
                  setShowForm(true)
                }
              : undefined
          }
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
