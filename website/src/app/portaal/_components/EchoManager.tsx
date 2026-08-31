'use client'

import { useState, useRef } from 'react'
import { Echo } from '@/lib/types'
import { TAK_NAMEN, TAK_KLEUREN, MAANDEN } from '@/lib/constants'
import ConfirmDialog from './ConfirmDialog'
import PortaalToast, { ToastState } from './PortaalToast'

const WERKJAAR_MAANDEN = [
  { monthNum: 9, label: 'September' },
  { monthNum: 10, label: 'Oktober' },
  { monthNum: 11, label: 'November' },
  { monthNum: 12, label: 'December' },
  { monthNum: 1, label: 'Januari' },
  { monthNum: 2, label: 'Februari' },
  { monthNum: 3, label: 'Maart' },
  { monthNum: 4, label: 'April' },
  { monthNum: 5, label: 'Mei' },
  { monthNum: 6, label: 'Juni' },
  { monthNum: 7, label: 'Juli' },
  { monthNum: 8, label: 'Augustus' },
]

// EXACTLY 4 TAKKEN: Kapoenen, Welpen, Jonggivers, Givers
const FOUR_TAKKEN = ['kapoenen', 'welpen', 'jonggivers', 'givers']

interface Props {
  initialEchos: Echo[]
  isGroepsleiding?: boolean
}

export default function EchoManager({ initialEchos, isGroepsleiding = false }: Props) {
  const [activeTak, setActiveTak] = useState('kapoenen')
  const [echos, setEchos] = useState<Echo[]>(initialEchos)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)

  // Upload Form State (Left Column)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [uploadMonth, setUploadMonth] = useState<number>(currentMonth)
  const [uploadYear, setUploadYear] = useState<number>(currentYear)
  const [echoDroppedFile, setEchoDroppedFile] = useState<File | null>(null)
  const [echoDragOver, setEchoDragOver] = useState(false)
  const echoFileInputRef = useRef<HTMLInputElement>(null)

  const [uploadFlash, setUploadFlash] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function showFlash(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ text: msg, type })
  }

  function showUploadFlash(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    setUploadFlash({ message: msg, type })
    setTimeout(() => setUploadFlash(null), 4500)
  }

  const takEchos = echos.filter(e => e.tak === activeTak && e.approved)

  async function handleUploadEchoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const file = echoDroppedFile
    if (!file || !file.size) {
      showUploadFlash('Selecteer a.u.b. een PDF bestand.', 'error')
      setLoading(false)
      return
    }

    const alreadyExists = echos.some(
      echo => echo.tak === activeTak && echo.month === uploadMonth && echo.year === uploadYear
    )

    if (alreadyExists) {
      const maandLabel = WERKJAAR_MAANDEN.find(m => m.monthNum === uploadMonth)?.label || uploadMonth
      showUploadFlash(`Er bestaat al een Kriko Echo voor ${maandLabel} ${uploadYear}. Verwijder eerst de bestaande Echo.`, 'error')
      setLoading(false)
      return
    }

    const uploadFd = new FormData()
    uploadFd.append('file', file)
    uploadFd.append('type', 'echo')
    uploadFd.append('echoTak', activeTak)
    uploadFd.append('echoMonth', String(uploadMonth))
    uploadFd.append('echoYear', String(uploadYear))

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: uploadFd })
      const data = await res.json().catch(() => null)

      if (res.ok && data && !data.error) {
        setEchos(prev => [data, ...prev])
        setEchoDroppedFile(null)
        showUploadFlash(isGroepsleiding ? 'Echo succesvol geüpload!' : 'Echo succesvol geüpload! Deze staat nu in afwachting van goedkeuring.', 'success')
      } else {
        showUploadFlash(data?.error || 'Fout bij het uploaden van de Echo.', 'error')
      }
    } catch (err) {
      console.error('Upload catch error:', err)
      showUploadFlash('Netwerkfout bij uploaden.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproveEcho(id: string) {
    try {
      const res = await fetch(`/api/admin/echos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      const updated = await res.json()
      if (res.ok && updated && !updated.error) {
        setEchos(prev => prev.map(e => e.id === id ? { ...e, approved: true } : e))
        showFlash('Echo goedgekeurd en gepubliceerd!')
      } else {
        showFlash(updated?.error || 'Fout bij goedkeuren.')
      }
    } catch (err) {
      console.error('Approve Echo error:', err)
      showFlash('Netwerkfout bij goedkeuren.')
    }
  }

  function handleDeleteEcho(id: string) {
    setConfirmDialog({
      message: 'Wil je deze Echo definitief verwijderen?',
      onConfirm: async () => {
        setConfirmDialog(null)
        const res = await fetch(`/api/admin/echos/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setEchos(prev => prev.filter(e => e.id !== id))
          showFlash('Echo verwijderd.')
        } else {
          showFlash('Fout bij verwijderen.')
        }
      },
    })
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', width: '100%', padding: '28px 20px 60px', boxSizing: 'border-box' }} className="portaal-page-container">

      {/* Tak Filters: 4 takken side-by-side on 1 line (taller / more square) */}
      <div className="portaal-echo-takken-row" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 14,
        width: '100%',
        maxWidth: 780,
        margin: '0 auto 28px auto',
      }}>
        {FOUR_TAKKEN.map(tak => {
          const isActive = activeTak === tak
          const customColor = TAK_KLEUREN[tak] || '#162544'
          const unapprovedCount = echos.filter(e => !e.approved && e.tak === tak).length

          return (
            <div key={tak} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setActiveTak(tak)}
                className="portaal-tak-btn"
                style={{
                  width: '100%',
                  minHeight: 56,
                  borderRadius: 14,
                  border: isActive ? `2.5px solid ${customColor}` : '1.5px solid #CCCCCC',
                  background: isActive ? customColor : '#FFFFFF',
                  color: isActive ? (tak === 'kapoenen' ? '#3A2A00' : '#FFFFFF') : '#1A1A1A',
                  fontWeight: 900,
                  fontSize: '1.02rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 6px 16px rgba(0,0,0,0.14)' : '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {TAK_NAMEN[tak] ?? tak}
              </button>

              {isGroepsleiding && unapprovedCount > 0 && (
                <span
                  title={`${unapprovedCount} nog goed te keuren`}
                  className="portaal-tak-badge"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: customColor,
                    color: tak === 'kapoenen' ? '#3A2A00' : '#FFFFFF',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    border: '2px solid #FFFFFF',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
                  {unapprovedCount}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 2-Column Layout: Balanced Uploadzone Left (1.5fr), Compact List Right (0.85fr) */}
      <div className="portaal-echo-grid">
        
        {/* LEFT COLUMN: Uploadzone */}
        <div className="portaal-echo-upload-card" style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #CCCCCC',
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
          minHeight: 480,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              margin: '0 0 24px',
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#162544',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#243B6B' }}></i>
              <span>Kriko Echo Uploaden</span>
            </h2>

            <form onSubmit={handleUploadEchoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* NOTIFICATIE IN DE UPLOADBOX (Bovenaan de box, boven de selectors) */}
              {uploadFlash && (
                <div style={{
                  background: '#FFFFFF',
                  border: `2px solid ${uploadFlash.type === 'success' ? '#16A34A' : '#DC2626'}`,
                  color: uploadFlash.type === 'success' ? '#15803D' : '#991B1B',
                  padding: '14px 18px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: uploadFlash.type === 'success'
                    ? '0 4px 12px rgba(22,163,74,0.12)'
                    : '0 4px 12px rgba(220,38,38,0.12)',
                }}>
                  <i className={`fa-solid ${uploadFlash.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ fontSize: '1.35rem' }}></i>
                  <span>{uploadFlash.message}</span>
                </div>
              )}

              {/* Selectors (Maand & Jaar) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 6 }}>
                    Maand
                  </label>
                  <select
                    value={uploadMonth}
                    onChange={(e) => setUploadMonth(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #CCCCCC',
                      background: '#F8FAF8',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      color: '#1A1A1A',
                    }}
                  >
                    {WERKJAAR_MAANDEN.map(m => (
                      <option key={m.monthNum} value={m.monthNum}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 6 }}>
                    Jaar
                  </label>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #CCCCCC',
                      background: '#F8FAF8',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      color: '#1A1A1A',
                    }}
                  >
                    <option value={currentYear - 1}>{currentYear - 1}</option>
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear + 1}>{currentYear + 1}</option>
                  </select>
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setEchoDragOver(true) }}
                onDragLeave={() => setEchoDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setEchoDragOver(false)
                  const f = e.dataTransfer.files[0]
                  if (f && f.type === 'application/pdf') setEchoDroppedFile(f)
                  else showUploadFlash('Enkel PDF bestanden zijn toegestaan.', 'error')
                }}
                onClick={() => echoFileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${echoDragOver ? '#243B6B' : '#CCCCCC'}`,
                  borderRadius: 16,
                  background: echoDragOver ? '#EBF0F9' : '#F8FAF8',
                  padding: '52px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minHeight: 200,
                }}
              >
                <input
                  ref={echoFileInputRef}
                  type="file"
                  name="echoFile"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) setEchoDroppedFile(f)
                  }}
                />
                {echoDroppedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <i className="fa-solid fa-file-pdf" style={{ color: '#243B6B', fontSize: '2.8rem' }}></i>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A1A1A' }}>{echoDroppedFile.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setEchoDroppedFile(null) }}
                      style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: '1.3rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '3.6rem', color: '#243B6B', marginBottom: 14 }}></i>
                    <span style={{ fontSize: '1.05rem', color: '#4A5568', fontWeight: 500 }}>
                      Sleep PDF bestand hierheen of <strong style={{ color: '#243B6B', fontWeight: 800 }}>klik om te bladeren</strong>
                    </span>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !echoDroppedFile}
                style={{
                  padding: '16px 28px',
                  borderRadius: 12,
                  background: '#243B6B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: echoDroppedFile ? 'pointer' : 'not-allowed',
                  opacity: echoDroppedFile ? 1 : 0.65,
                  boxShadow: echoDroppedFile ? '0 4px 14px rgba(36,59,107,0.3)' : 'none',
                }}
              >
                {loading ? 'Uploaden…' : 'Kriko Echo Opslaan'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Smaller Compact List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Unapproved Section — Filtered by activeTak */}
          {(() => {
            const activeTakUnapprovedEchos = echos.filter(e => !e.approved && e.tak === activeTak)
            if (activeTakUnapprovedEchos.length === 0) return null

            return (
              <div style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #CCCCCC',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '18px 20px',
              }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1.15rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                  Nog goed te keuren
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeTakUnapprovedEchos.map(echo => {
                    const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/echos/${echo.file_name}`
                    return (
                      <a
                        key={echo.id}
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: '#F8FAF8',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F0F4FA'
                          e.currentTarget.style.borderColor = '#CBD5E1'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F8FAF8'
                          e.currentTarget.style.borderColor = '#E2E8F0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <i className="fa-solid fa-file-pdf" style={{ color: '#243B6B', fontSize: '1.4rem', flexShrink: 0 }}></i>
                          <strong style={{ fontSize: '1.02rem', color: '#162544', fontWeight: 700, textTransform: 'capitalize' }}>
                            {MAANDEN[echo.month]} {echo.year}
                          </strong>
                        </div>

                        {isGroepsleiding ? (
                          /* Ultra-sleek Segmented Action Pill for Groepsleiding */
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 9999,
                            border: '1.5px solid #CBD5E1',
                            background: '#FFFFFF',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            height: 28,
                            flexShrink: 0,
                          }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleApproveEcho(echo.id)
                              }}
                              title="Goedkeuren"
                              aria-label="Goedkeuren"
                              style={{
                                padding: '0 11px 0 11px',
                                height: '100%',
                                background: 'transparent',
                                color: '#16A34A',
                                border: 'none',
                                borderRight: '1.5px solid #CBD5E1',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                transform: 'skewX(-14deg)',
                                marginLeft: -4,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#16A34A'
                                e.currentTarget.style.color = '#FFFFFF'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#16A34A'
                              }}
                            >
                              <span style={{ transform: 'skewX(14deg)', display: 'inline-flex' }}>
                                <i className="fa-solid fa-check"></i>
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteEcho(echo.id)
                              }}
                              title="Wis"
                              aria-label="Wis"
                              style={{
                                padding: '0 11px 0 11px',
                                height: '100%',
                                background: 'transparent',
                                color: '#DC2626',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                transform: 'skewX(-14deg)',
                                marginRight: -4,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#DC2626'
                                e.currentTarget.style.color = '#FFFFFF'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#DC2626'
                              }}
                            >
                              <span style={{ transform: 'skewX(14deg)', display: 'inline-flex' }}>
                                <i className="fa-solid fa-xmark"></i>
                              </span>
                            </button>
                          </div>
                        ) : (
                          /* Pending badge & Delete button for Regular Leiding */
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                            }}>
                              <i className="fa-regular fa-clock" style={{ fontSize: '0.75rem' }}></i>
                              <span>In afwachting</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteEcho(echo.id)
                              }}
                              title="Wis"
                              aria-label="Wis"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1.5px solid #CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#DC2626'
                                e.currentTarget.style.color = '#FFFFFF'
                                e.currentTarget.style.borderColor = '#DC2626'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF'
                                e.currentTarget.style.color = '#DC2626'
                                e.currentTarget.style.borderColor = '#CBD5E1'
                              }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Compact Published Echos List */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #CCCCCC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '18px 20px',
          }}>
            <h3 style={{
              margin: '0 0 14px',
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#162544',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}>
              <span>Kriko Echo&apos;s</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#555555' }}>({takEchos.length})</span>
            </h3>

            {takEchos.length === 0 ? (
              <div style={{ padding: '14px 0', textAlign: 'center', color: '#666666', fontSize: '0.84rem', fontStyle: 'italic' }}>
                Nog geen goedgekeurde Kriko Echo&apos;s.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {takEchos.map(echo => {
                  const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/echos/${echo.file_name}`
                  return (
                    <a
                      key={echo.id}
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: '#F8FAF8',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0F4FA'
                        e.currentTarget.style.borderColor = '#CBD5E1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8FAF8'
                        e.currentTarget.style.borderColor = '#E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <i className="fa-solid fa-file-pdf" style={{ color: '#243B6B', fontSize: '1.4rem', flexShrink: 0 }}></i>
                        <strong style={{ fontSize: '1.02rem', color: '#162544', fontWeight: 700, textTransform: 'capitalize' }}>
                          {MAANDEN[echo.month]} {echo.year}
                        </strong>
                      </div>

                      {/* Inverted Wis Button with Cross Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteEcho(echo.id)
                        }}
                        title="Wis"
                        aria-label="Wis"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          color: '#DC2626',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#DC2626'
                          e.currentTarget.style.color = '#FFFFFF'
                          e.currentTarget.style.borderColor = '#DC2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF'
                          e.currentTarget.style.color = '#DC2626'
                          e.currentTarget.style.borderColor = '#CBD5E1'
                        }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Toast Notificatie (Portaalblauw) */}
      <PortaalToast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
