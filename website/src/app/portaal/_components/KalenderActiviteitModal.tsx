'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarEvent, AudienceTag } from '@/lib/types'
import { AUDIENCE_TAGS, AUDIENCE_NAMEN, PORTAAL_AUDIENCE_KLEUREN } from '@/lib/constants'
import { PRESET_EVENT_ICONS } from '@/lib/calendar'
import { useScrollLock } from '@/lib/useScrollLock'

type FormState = {
  title: string; date: string; datum_tot: string; timeStart: string; timeEnd: string
  location: string; description: string; audience: AudienceTag[]
  is_evenement: boolean; banner_image: string; icon: string
  facebook_event_url: string; facebook_post_url: string; external_link_url: string; document_url: string
}

function parseTime(time: string) {
  const parts = time.split(/\s*[-–]\s*/)
  return { timeStart: parts[0]?.trim() ?? '', timeEnd: parts[1]?.trim() ?? '' }
}

function emptyForm(preAudience: AudienceTag[]): FormState {
  return {
    title: '', date: '', datum_tot: '', timeStart: '', timeEnd: '',
    location: '', description: '', audience: preAudience,
    is_evenement: false, banner_image: '', icon: '',
    facebook_event_url: '', facebook_post_url: '', external_link_url: '', document_url: '',
  }
}

export default function KalenderActiviteitModal({
  canPublish,
  initialAudience = [],
  editEvent,
  onClose,
  onSaved,
  onDeleted,
}: {
  canPublish: boolean
  initialAudience?: AudienceTag[]
  editEvent?: CalendarEvent
  onClose: () => void
  onSaved: (event: CalendarEvent, isNew: boolean) => void
  onDeleted?: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'basis' | 'opties'>('basis')
  const [form, setForm] = useState<FormState>(() =>
    editEvent
      ? {
          title: editEvent.title, date: editEvent.date, datum_tot: editEvent.datum_tot ?? '',
          location: editEvent.location, description: editEvent.description, audience: editEvent.audience,
          is_evenement: editEvent.is_evenement, banner_image: editEvent.banner_image ?? '', icon: editEvent.icon ?? '',
          facebook_event_url: editEvent.facebook_event_url ?? '', facebook_post_url: editEvent.facebook_post_url ?? '',
          external_link_url: editEvent.external_link_url ?? '', document_url: editEvent.document_url ?? '',
          ...parseTime(editEvent.time)
        }
      : emptyForm(initialAudience)
  )
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState('')
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())
  const [facebookLinkOpen, setFacebookLinkOpen] = useState(!!(editEvent?.facebook_event_url || editEvent?.facebook_post_url))
  const [externalLinkOpen, setExternalLinkOpen] = useState(!!(editEvent?.external_link_url))
  const [documentOpen, setDocumentOpen] = useState(!!(editEvent?.document_url))
  const [isMeerdaags, setIsMeerdaags] = useState(!!(editEvent?.datum_tot))

  useScrollLock(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectableTags: AudienceTag[] = canPublish
    ? [...AUDIENCE_TAGS]
    : AUDIENCE_TAGS.filter(t => t !== 'groep' && t !== 'grl')

  function toggleAudience(tag: AudienceTag) {
    setForm(p => {
      const has = p.audience.includes(tag)
      return { ...p, audience: has ? p.audience.filter(a => a !== tag) : [...p.audience, tag] }
    })
  }

  async function uploadMedia(file: File, type: 'evenement-banner' | 'evenement-document'): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (!res.ok) { setFlash('Fout bij uploaden van bestand.'); return null }
    return ((await res.json()).url) as string
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const url = await uploadMedia(file, 'evenement-banner')
    if (url) setForm(p => ({ ...p, banner_image: url }))
    setLoading(false)
  }

  async function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const url = await uploadMedia(file, 'evenement-document')
    if (url) setForm(p => ({ ...p, document_url: url }))
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = new Set<string>()
    if (!form.title.trim()) errors.add('title')
    if (!form.date) errors.add('date')
    if (!form.timeStart && !form.timeEnd) errors.add('time')
    if (form.audience.length === 0) errors.add('audience')
    if (errors.size > 0) {
      setValidationErrors(errors)
      setActiveTab('basis') // Switch to basis tab to show validation error
      setTimeout(() => setValidationErrors(new Set()), 3500)
      return
    }
    setValidationErrors(new Set())
    setLoading(true)
    const payload = {
      title: form.title, date: form.date, datum_tot: (isMeerdaags && form.datum_tot) ? form.datum_tot : null,
      time: [form.timeStart, form.timeEnd].filter(Boolean).join(' - '),
      location: form.location, description: form.description,
      audience: form.audience, is_evenement: form.is_evenement,
      banner_image: form.banner_image || '',
      icon: form.icon || null,
      facebook_event_url: form.facebook_event_url || '',
      facebook_post_url: form.facebook_post_url || '',
      external_link_url: form.external_link_url || '',
      document_url: form.document_url || '',
    }
    const isNew = !editEvent
    const url = editEvent ? `/api/admin/calendar/${editEvent.id}` : '/api/admin/calendar'
    const method = editEvent ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      onSaved(await res.json(), isNew)
    } else {
      const err = await res.json().catch(() => ({}))
      setFlash(err.error || 'Fout bij het opslaan.')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!editEvent) return
    setLoading(true)
    const res = await fetch(`/api/admin/calendar/${editEvent.id}`, { method: 'DELETE' })
    if (res.ok) { onDeleted?.(editEvent.id) }
    else setFlash('Fout bij verwijderen.')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #D0DCEE', borderRadius: 10,
    fontFamily: 'inherit', fontSize: '.9rem', boxSizing: 'border-box' as const, background: '#FFF'
  }
  const labelStyle = { display: 'block', fontSize: '.82rem', fontWeight: 800, color: '#162544', marginBottom: 6 }
  const errorOutline = (f: string): React.CSSProperties => validationErrors.has(f)
    ? { boxShadow: '0 0 0 2px #e74c3c, 0 0 10px rgba(231,76,60,.35)', borderRadius: 10 }
    : {}

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="portaal-modal-overlay kalender-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(22,37,68,0.55)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 3500 }} onClick={onClose} />
      <div className="portaal-modal-overlay kalender-modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3700, padding: '36px 16px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: '95%', maxWidth: 720, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto', overflowX: 'hidden', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #EDE8D0' }}>
            <div>
              <h3 style={{ margin: 0, color: '#162544', fontWeight: 900, fontSize: '1.3rem', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                {editEvent ? 'Activiteit bewerken' : 'Nieuwe activiteit'}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {editEvent && (
                <button type="button" onClick={handleDelete}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#FFF5F5', border: '1.5px solid #E0C0C4', borderRadius: 10, color: '#B23A4D', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <i className="fas fa-trash" style={{ fontSize: '.75rem' }}></i> Verwijderen
                </button>
              )}
              <button type="button" onClick={onClose}
                style={{ width: 34, height: 34, border: '1px solid #D0DCEE', borderRadius: '50%', background: '#F0ECE4', color: '#1A1A1A', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #EDE8D0', paddingBottom: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab('basis')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'basis' ? '#243B6B' : '#EBF0F9',
                color: activeTab === 'basis' ? '#fff' : '#243B6B',
                fontWeight: 800,
                fontSize: '.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Basisgegevens
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('opties')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'opties' ? '#243B6B' : '#EBF0F9',
                color: activeTab === 'opties' ? '#fff' : '#243B6B',
                fontWeight: 800,
                fontSize: '.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Opties & Links
            </button>
          </div>

          {flash && (
            <div style={{ background: '#EBF0F9', border: '1.5px solid #243B6B', color: '#162544', padding: '10px 14px', borderRadius: 10, fontWeight: 600, fontSize: '.9rem' }}>
              {flash}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* TAB 1: BASISGEGEVENS */}
            {activeTab === 'basis' && (
              <>
                {/* Audience tags */}
                <div style={{ ...errorOutline('audience'), borderRadius: 10 }}>
                  <label style={labelStyle}>Voor wie is dit bedoeld? (tags) *</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectableTags.map(tag => {
                      const on = form.audience.includes(tag)
                      const tagColor = PORTAAL_AUDIENCE_KLEUREN[tag]
                      return (
                        <button key={tag} type="button" onClick={() => toggleAudience(tag)}
                          style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${tagColor}`, cursor: 'pointer', fontSize: '.8rem', fontWeight: 700,
                            background: on ? tagColor : 'transparent', color: on ? (tag === 'kapoenen' ? '#3a2a00' : '#fff') : tagColor, transition: 'all 0.15s ease' }}>
                          {on ? '✓ ' : ''}{AUDIENCE_NAMEN[tag]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Titel van activiteit *</label>
                  <input style={{ ...inputStyle, ...errorOutline('title') }} value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    onBlur={() => setForm(p => ({ ...p, title: p.title.trim() }))}
                    placeholder="bijv. Vergadering of Groeps-BBQ" />
                </div>

                {/* Date & Time */}
                <div className="cal-modal-datetime-grid" style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Tijdstip (van – tot)</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', ...errorOutline('time') }}>
                      <input type="time" style={{ ...inputStyle, flex: 1 }} value={form.timeStart} onChange={e => setForm(p => ({ ...p, timeStart: e.target.value }))} />
                      <span style={{ color: '#666666', fontWeight: 600, fontSize: '.85rem', flexShrink: 0 }}>–</span>
                      <input type="time" style={{ ...inputStyle, flex: 1 }} value={form.timeEnd} onChange={e => setForm(p => ({ ...p, timeEnd: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Datum *</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input type="date" style={{ ...inputStyle, width: '100%', ...errorOutline('date') }} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      {isMeerdaags ? (
                        <>
                          <span style={{ color: '#666666', fontWeight: 600, fontSize: '.85rem', flexShrink: 0 }}>–</span>
                          <div style={{ flex: 1 }}>
                            <input type="date" style={{ ...inputStyle, width: '100%', background: '#fafaf8', fontSize: '.85rem' }} value={form.datum_tot} onChange={e => setForm(p => ({ ...p, datum_tot: e.target.value }))} />
                          </div>
                          <button type="button" onClick={() => { setIsMeerdaags(false); setForm(p => ({ ...p, datum_tot: '' })) }} title="Einddatum verwijderen"
                            style={{ flexShrink: 0, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}>×</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => { setIsMeerdaags(true); setForm(p => ({ ...p, datum_tot: p.date || new Date().toISOString().split('T')[0] })) }}
                          style={{ flexShrink: 0, background: 'none', border: 'none', color: '#243B6B', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700, padding: '5px 8px', whiteSpace: 'nowrap', textDecoration: 'underline' }}>
                          + meerdaags
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Description */}
                <div>
                  <label style={labelStyle}>Locatie</label>
                  <input style={inputStyle} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    onBlur={() => setForm(p => ({ ...p, location: p.location.trim() }))} placeholder="bijv. Scoutslokalen Kriko-M" />
                </div>
                <div>
                  <label style={labelStyle}>Omschrijving & Praktische info</label>
                  <textarea style={inputStyle} rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    onBlur={() => setForm(p => ({ ...p, description: p.description.trim() }))} placeholder="Korte tekst met praktische informatie..." />
                </div>
              </>
            )}

            {/* TAB 2: OPTIES & LINKS */}
            {activeTab === 'opties' && (
              <>
                {/* Optional Icon Selector */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Icoontje kiezen (optioneel)</label>
                    {form.icon ? (
                      <span style={{ fontSize: '.78rem', color: '#243B6B', fontWeight: 700 }}>
                        Geselecteerd: {PRESET_EVENT_ICONS.find(i => i.id === form.icon)?.label || form.icon}
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                      gap: 8,
                      maxHeight: 180,
                      overflowY: 'auto',
                      padding: 10,
                      background: '#F8FAFC',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {PRESET_EVENT_ICONS.filter(ic => ic.id).map((ic) => {
                      const isSelected = form.icon === ic.id
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, icon: p.icon === ic.id ? '' : ic.id }))}
                          title={ic.label}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.15rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            border: isSelected ? '2px solid #162544' : '1px solid #C5D5EA',
                            background: isSelected ? '#243B6B' : '#EBF0F9',
                            color: isSelected ? '#FFFFFF' : '#243B6B',
                            boxShadow: isSelected ? '0 3px 8px rgba(36, 59, 107, 0.35)' : 'none',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          <i className={`fa-solid ${ic.id}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4 Selectors onder elkaar in dezelfde stijl (als één geheel met topbalk & dropdown) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  
                  {/* 1. Belangrijk evenement */}
                  <div style={{
                    background: '#EBF0F9',
                    border: '1.5px solid #D0DCEE',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#162544',
                      fontSize: '.88rem',
                      padding: '12px 16px',
                      userSelect: 'none',
                      background: form.is_evenement ? '#E2EAF6' : '#EBF0F9',
                    }}>
                      <input
                        type="checkbox"
                        checked={form.is_evenement}
                        onChange={e => setForm(p => ({ ...p, is_evenement: e.target.checked }))}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#243B6B' }}
                      />
                      Belangrijk evenement
                    </label>
                  </div>

                  {/* 2. Inschrijflink */}
                  <div style={{
                    background: '#EBF0F9',
                    border: '1.5px solid #D0DCEE',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#162544',
                      fontSize: '.88rem',
                      padding: '12px 16px',
                      userSelect: 'none',
                      background: externalLinkOpen ? '#E2EAF6' : '#EBF0F9',
                    }}>
                      <input
                        type="checkbox"
                        checked={externalLinkOpen}
                        onChange={e => setExternalLinkOpen(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#243B6B' }}
                      />
                      Inschrijflink
                    </label>
                    {externalLinkOpen && (
                      <div style={{ padding: '14px 16px', background: '#FFFFFF', borderTop: '1.5px solid #D0DCEE', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Invulformulier / Inschrijflink (URL)</label>
                        <input
                          style={inputStyle}
                          value={form.external_link_url}
                          onChange={e => setForm(p => ({ ...p, external_link_url: e.target.value }))}
                          placeholder="https://forms.google.com/... of inschrijf-URL"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Uitnodiging */}
                  <div style={{
                    background: '#EBF0F9',
                    border: '1.5px solid #D0DCEE',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#162544',
                      fontSize: '.88rem',
                      padding: '12px 16px',
                      userSelect: 'none',
                      background: documentOpen ? '#E2EAF6' : '#EBF0F9',
                    }}>
                      <input
                        type="checkbox"
                        checked={documentOpen}
                        onChange={e => setDocumentOpen(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#243B6B' }}
                      />
                      Uitnodiging
                    </label>
                    {documentOpen && (
                      <div style={{ padding: '14px 16px', background: '#FFFFFF', borderTop: '1.5px solid #D0DCEE', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Uitnodiging uploaden (PDF, JPG, PNG)</label>
                        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleDocumentChange} style={{ fontSize: '.8rem' }} />
                        {form.document_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                            <a href={form.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.82rem', color: '#243B6B', fontWeight: 700, textDecoration: 'underline' }}>
                              📄 Huidige uitnodiging bekijken
                            </a>
                            <button
                              type="button"
                              onClick={() => setForm(p => ({ ...p, document_url: '' }))}
                              style={{ fontSize: '.78rem', color: '#B23A4D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✕ Verwijderen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. Facebook link */}
                  <div style={{
                    background: '#EBF0F9',
                    border: '1.5px solid #D0DCEE',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#162544',
                      fontSize: '.88rem',
                      padding: '12px 16px',
                      userSelect: 'none',
                      background: facebookLinkOpen ? '#E2EAF6' : '#EBF0F9',
                    }}>
                      <input
                        type="checkbox"
                        checked={facebookLinkOpen}
                        onChange={e => setFacebookLinkOpen(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#243B6B' }}
                      />
                      Facebook link
                    </label>
                    {facebookLinkOpen && (
                      <div style={{ padding: '14px 16px', background: '#FFFFFF', borderTop: '1.5px solid #D0DCEE', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={labelStyle}>Facebook evenement link</label>
                          <input style={inputStyle} value={form.facebook_event_url} onChange={e => setForm(p => ({ ...p, facebook_event_url: e.target.value }))} placeholder="https://facebook.com/events/..." />
                        </div>
                        <div>
                          <label style={labelStyle}>Facebook post URL (voor embed)</label>
                          <input style={inputStyle} value={form.facebook_post_url} onChange={e => setForm(p => ({ ...p, facebook_post_url: e.target.value }))} placeholder="https://www.facebook.com/ScoutsKrikoM/posts/..." />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Cover foto voor publieke kalender */}
                {canPublish && form.audience.includes('groep') && (
                  <div style={{ padding: '12px 16px', background: '#EBF0F9', border: '1.5px solid #D0DCEE', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 800, color: '#162544' }}>📸 Coverfoto voor publieke kalender (optioneel)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} style={{ fontSize: '.8rem' }} />
                    {form.banner_image && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.banner_image} alt="cover" style={{ width: 120, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" onClick={() => setForm(p => ({ ...p, banner_image: '' }))}
                          style={{ fontSize: '.78rem', color: '#B23A4D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                          ✕ Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid #EDE8D0' }}>
              <button type="submit" disabled={loading}
                style={{ padding: '12px 24px', background: '#243B6B', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '.95rem', flex: 1, boxShadow: '0 4px 12px rgba(36,59,107,0.25)' }}>
                {loading ? 'Bezig…' : editEvent ? 'Wijzigingen opslaan' : 'Activiteit opslaan'}
              </button>
              <button type="button" onClick={onClose}
                style={{ padding: '12px 24px', background: '#F0ECE4', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, color: '#1A1A1A', cursor: 'pointer', fontSize: '.95rem' }}>
                Annuleren
              </button>
            </div>

          </form>
        </div>
      </div>
    </>,
    document.body
  )
}
