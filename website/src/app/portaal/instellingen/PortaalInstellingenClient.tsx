'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Settings } from '@/lib/types'

interface AccountInfo {
  id: string | null
  role: string
  email: string
  naam: string
  password?: string
}

interface Props {
  initialSettings: Settings
  role?: string
}

export default function PortaalInstellingenClient({ initialSettings }: Props) {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Titels & Subtitels per rol op de startpagina
  const [homeTitleLeiding, setHomeTitleLeiding] = useState<string>(
    initialSettings?.home_title_leiding || (initialSettings?.home_title && initialSettings.home_title !== 'Leidingportaal' ? initialSettings.home_title : 'Welkom leiding')
  )
  const [homeSubtitleLeiding, setHomeSubtitleLeiding] = useState<string>(
    initialSettings?.home_subtitle_leiding || initialSettings?.home_subtitle || ''
  )
  const [homeTitleGroepsleiding, setHomeTitleGroepsleiding] = useState<string>(
    initialSettings?.home_title_groepsleiding || (initialSettings?.home_title && initialSettings.home_title !== 'Leidingportaal' ? initialSettings.home_title : 'Welkom groepsleiding')
  )
  const [homeSubtitleGroepsleiding, setHomeSubtitleGroepsleiding] = useState<string>(
    initialSettings?.home_subtitle_groepsleiding || initialSettings?.home_subtitle || ''
  )
  const [homeLeidingFoto, setHomeLeidingFoto] = useState<string>(
    initialSettings?.home_leiding_foto || '/images/leiding_25-26.jpg'
  )
  const [uploadingHomeFoto, setUploadingHomeFoto] = useState(false)
  const [portalLoginFoto, setPortalLoginFoto] = useState<string>(
    initialSettings?.portal_login_foto || '/images/hero-nieuw.webp'
  )
  const [uploadingLoginFoto, setUploadingLoginFoto] = useState(false)
  const [webshopEmail] = useState<string>(
    initialSettings?.webshop_email || 'groepsleiding@kriko-m.be'
  )

  const [activeTitleRoleTab, setActiveTitleRoleTab] = useState<'leiding' | 'groepsleiding'>('leiding')

  // Accountbeheer State
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [editingAccountRole, setEditingAccountRole] = useState<'leiding' | 'groepsleiding' | 'webshop'>('leiding')
  const [editAccountName, setEditAccountName] = useState('')
  const [editAccountPassword, setEditAccountPassword] = useState('')
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountSuccess, setAccountSuccess] = useState('')
  const [accountError, setAccountError] = useState('')

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    setAccountError('')
    setAccountSuccess('')
    try {
      const res = await fetch('/api/admin/accounts')
      const data = await res.json()
      if (data.accounts) {
        setAccounts(data.accounts)
        const target = data.accounts.find((a: AccountInfo) => a.role === editingAccountRole)
        if (target) {
          setEditAccountName(target.naam)
          setEditAccountPassword(target.password || '')
        }
      }
    } catch {
      setAccountError('Kon accountgegevens niet laden.')
    } finally {
      setLoadingAccounts(false)
    }
  }, [editingAccountRole])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  function showNotification(type: 'success' | 'error', text: string) {
    setFlashMessage({ type, text })
    setTimeout(() => setFlashMessage(null), 4500)
  }

  async function handleHomeFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingHomeFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'home-leiding-foto')
      if (homeLeidingFoto && homeLeidingFoto.startsWith('http')) {
        formData.append('oldUrl', homeLeidingFoto)
      }

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Uploaden foto mislukt')
      }
      const data = await res.json()
      if (data.url) {
        setHomeLeidingFoto(data.url)
        showNotification('success', 'Nieuwe leidingsfoto geüpload! Vergeet niet hieronder op "Wijzigingen Opslaan" te klikken.')
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij uploaden foto'
      showNotification('error', errorText)
    } finally {
      setUploadingHomeFoto(false)
      e.target.value = ''
    }
  }

  async function handleLoginFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLoginFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'portal-login-foto')
      if (portalLoginFoto && portalLoginFoto.startsWith('http')) {
        formData.append('oldUrl', portalLoginFoto)
      }

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Uploaden foto mislukt')
      }
      const data = await res.json()
      if (data.url) {
        setPortalLoginFoto(data.url)
        showNotification('success', 'Nieuwe login-achtergrondfoto geüpload! Vergeet niet hieronder op "Wijzigingen Opslaan" te klikken.')
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij uploaden foto'
      showNotification('error', errorText)
    } finally {
      setUploadingLoginFoto(false)
      e.target.value = ''
    }
  }

  function handleSelectAccountRole(roleType: 'leiding' | 'groepsleiding' | 'webshop') {
    setEditingAccountRole(roleType)
    setShowAccountPassword(false)
    setAccountError('')
    setAccountSuccess('')
    const target = accounts.find(a => a.role === roleType)
    if (target) {
      setEditAccountName(target.naam)
      setEditAccountPassword(target.password || '')
    } else {
      setEditAccountName('')
      setEditAccountPassword('')
    }
  }

  async function handleSaveAccount(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSavingAccount(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editingAccountRole,
          newName: editAccountName,
          newPassword: editAccountPassword || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setAccountError(data.error || 'Fout bij opslaan van account.')
        return false
      } else {
        const roleLabel = editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'
        setAccountSuccess(`Account voor ${roleLabel} succesvol bijgewerkt!`)
        await fetchAccounts()
        router.refresh()
        return true
      }
    } catch {
      setAccountError('Netwerkfout bij opslaan.')
      return false
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleSavePortalSettings() {
    setSaving(true)
    setFlashMessage(null)
    try {
      const payload = {
        home_title_leiding: homeTitleLeiding,
        home_subtitle_leiding: homeSubtitleLeiding,
        home_title_groepsleiding: homeTitleGroepsleiding,
        home_subtitle_groepsleiding: homeSubtitleGroepsleiding,
        home_leiding_foto: homeLeidingFoto,
        portal_login_foto: portalLoginFoto,
        webshop_email: webshopEmail,
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Opslaan mislukt')
      }

      // If account name is filled, also save account
      if (editAccountName.trim()) {
        await handleSaveAccount()
      }

      const successText = 'Instellingen succesvol opgeslagen!'
      showNotification('success', successText)
      router.refresh()
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij opslaan'
      showNotification('error', errorText)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      width: '100%',
      padding: '32px 20px 60px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 24,
        border: '1px solid #CBD5E1',
        padding: '32px 36px',
        color: '#162544',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 20, marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-sliders" style={{ color: '#243B6B' }}></i>
              <span>Instellingen Leidingsportaal</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Pas de welkomsttitels, achtergrondfoto&apos;s en account-wachtwoorden (Leiding, Groepsleiding, Webshop) van het portaal aan.
            </p>
          </div>
        </div>

        {/* Flash Message Banner */}
        {flashMessage && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
            backgroundColor: flashMessage.type === 'success' ? '#EBF0F9' : '#FDF0F2',
            color: flashMessage.type === 'success' ? '#162544' : '#B23A4D',
            border: `1.5px solid ${flashMessage.type === 'success' ? '#CBD5E1' : '#E0C0C4'}`,
          }}>
            <i className={`fa-solid ${flashMessage.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`} />
            <span>{flashMessage.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* SECTIE 1: STARTPAGINA TITELS PER ROL */}
          <div style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              Welkomsttitel Op Startpagina
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#64748B' }}>
              Stel een unieke hoofdtitel en subtitel in voor gewone Leiding vs. Groepsleiding.
            </p>

            {/* Role Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTitleRoleTab('leiding')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: activeTitleRoleTab === 'leiding' ? '2px solid #243B6B' : '1.5px solid #CBD5E1',
                  backgroundColor: activeTitleRoleTab === 'leiding' ? '#243B6B' : '#fff',
                  color: activeTitleRoleTab === 'leiding' ? '#fff' : '#162544',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Voor Leiding
              </button>
              <button
                type="button"
                onClick={() => setActiveTitleRoleTab('groepsleiding')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: activeTitleRoleTab === 'groepsleiding' ? '2px solid #243B6B' : '1.5px solid #CBD5E1',
                  backgroundColor: activeTitleRoleTab === 'groepsleiding' ? '#243B6B' : '#fff',
                  color: activeTitleRoleTab === 'groepsleiding' ? '#fff' : '#162544',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Voor Groepsleiding
              </button>
            </div>

            {activeTitleRoleTab === 'leiding' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                    Hoofdtitel voor Leiding
                  </label>
                  <input
                    type="text"
                    value={homeTitleLeiding}
                    onChange={e => setHomeTitleLeiding(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                    Subtitel voor Leiding (Optioneel)
                  </label>
                  <textarea
                    value={homeSubtitleLeiding}
                    onChange={e => setHomeSubtitleLeiding(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: '#162544', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                    Hoofdtitel voor Groepsleiding
                  </label>
                  <input
                    type="text"
                    value={homeTitleGroepsleiding}
                    onChange={e => setHomeTitleGroepsleiding(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                    Subtitel voor Groepsleiding (Optioneel)
                  </label>
                  <textarea
                    value={homeSubtitleGroepsleiding}
                    onChange={e => setHomeSubtitleGroepsleiding(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: '#162544', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTIE 2: ACHTERGRONDFOTO'S PORTAAL */}
          <div style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                📸 Achtergrondfoto&apos;s Portaal
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                Beheer de achtergrondfoto&apos;s voor de loginpagina en de startpagina van het leidingportaal.
              </p>
            </div>

            {/* FOTO 1: STARTPAGINA LEIDINGSFOTO */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162544', marginBottom: 10 }}>
                1. Startpagina Achtergrondfoto (Leidingsfoto)
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  width: 220,
                  height: 120,
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #CBD5E1',
                  backgroundImage: `url(${homeLeidingFoto || '/images/leiding_25-26.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.45) 0%, rgba(36, 59, 107, 0.55) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', padding: '4px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, backdropFilter: 'blur(2px)' }}>
                      Preview filter
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    backgroundColor: '#243B6B',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: uploadingHomeFoto ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}>
                    <i className="fa-solid fa-upload"></i>
                    <span>{uploadingHomeFoto ? 'Foto verwerken…' : 'Nieuwe Leidingsfoto Uploaden'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingHomeFoto}
                      onChange={handleHomeFotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {homeLeidingFoto && homeLeidingFoto !== '/images/leiding_25-26.jpg' && (
                    <button
                      type="button"
                      onClick={() => setHomeLeidingFoto('/images/leiding_25-26.jpg')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        backgroundColor: '#FDF0F2',
                        color: '#B23A4D',
                        border: '1.5px solid #E0C0C4',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: 'fit-content',
                      }}
                    >
                      Herstel naar standaardfoto (/images/leiding_25-26.jpg)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* FOTO 2: LOGINPAGINA ACHTERGRONDFOTO */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162544', marginBottom: 10 }}>
                2. Loginpagina Achtergrondfoto (/portaal)
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  width: 220,
                  height: 120,
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #CBD5E1',
                  backgroundImage: `url(${portalLoginFoto || '/images/hero-nieuw.webp'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.45) 0%, rgba(36, 59, 107, 0.55) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', padding: '4px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, backdropFilter: 'blur(2px)' }}>
                      Login preview
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    backgroundColor: '#243B6B',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: uploadingLoginFoto ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}>
                    <i className="fa-solid fa-upload"></i>
                    <span>{uploadingLoginFoto ? 'Foto verwerken…' : 'Nieuwe Login-foto Uploaden'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingLoginFoto}
                      onChange={handleLoginFotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {portalLoginFoto && portalLoginFoto !== '/images/hero-nieuw.webp' && (
                    <button
                      type="button"
                      onClick={() => setPortalLoginFoto('/images/hero-nieuw.webp')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        backgroundColor: '#FDF0F2',
                        color: '#B23A4D',
                        border: '1.5px solid #E0C0C4',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: 'fit-content',
                      }}
                    >
                      Herstel naar standaardfoto (/images/hero-nieuw.webp)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTIE 3: ACCOUNTBEHEER & WACHTWOORDEN */}
          <div id="accountbeheer" style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              👥 Accountbeheer — Rollen &amp; Wachtwoorden
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#64748B' }}>
              Pas de weergavenaam of het wachtwoord aan voor de 3 hoofdaccounts van het portaal (Leiding, Groepsleiding, Webshop).
            </p>

            {loadingAccounts ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Accounts laden…</div>
            ) : (
              <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {accountError && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FDF0F2', color: '#B23A4D', border: '1px solid #E0C0C4', fontSize: '0.86rem', fontWeight: 700 }}>
                    {accountError}
                  </div>
                )}
                {accountSuccess && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#EBF0F9', color: '#162544', border: '1px solid #CBD5E1', fontSize: '0.86rem', fontWeight: 700 }}>
                    {accountSuccess}
                  </div>
                )}

                {/* Role Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleSelectAccountRole('leiding')}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 12,
                      border: editingAccountRole === 'leiding' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                      background: editingAccountRole === 'leiding' ? '#EBF0F9' : '#FFFFFF',
                      color: editingAccountRole === 'leiding' ? '#243B6B' : '#555555',
                      fontWeight: editingAccountRole === 'leiding' ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    Leiding
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAccountRole('groepsleiding')}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 12,
                      border: editingAccountRole === 'groepsleiding' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                      background: editingAccountRole === 'groepsleiding' ? '#EBF0F9' : '#FFFFFF',
                      color: editingAccountRole === 'groepsleiding' ? '#243B6B' : '#555555',
                      fontWeight: editingAccountRole === 'groepsleiding' ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    Groepsleiding
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAccountRole('webshop')}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 12,
                      border: editingAccountRole === 'webshop' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                      background: editingAccountRole === 'webshop' ? '#EBF0F9' : '#FFFFFF',
                      color: editingAccountRole === 'webshop' ? '#243B6B' : '#555555',
                      fontWeight: editingAccountRole === 'webshop' ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    Webshop
                  </button>
                </div>

                <div className="portaal-account-form-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                      Weergavenaam {editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'}
                    </label>
                    <input
                      type="text"
                      value={editAccountName}
                      onChange={(e) => setEditAccountName(e.target.value)}
                      required
                      placeholder="Bijv. Leiding Kriko-M"
                      disabled={savingAccount}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                      Wachtwoord {editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'}
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        ref={passwordInputRef}
                        type={showAccountPassword ? 'text' : 'password'}
                        value={editAccountPassword}
                        onChange={(e) => setEditAccountPassword(e.target.value)}
                        placeholder={editAccountPassword ? '••••••••' : 'Wachtwoord instellen (min. 6 tekens)'}
                        disabled={savingAccount}
                        style={{
                          width: '100%',
                          padding: '10px 76px 10px 12px',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 8,
                          fontSize: '0.9rem',
                          background: '#fff',
                          fontWeight: 700,
                          color: '#162544',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ position: 'absolute', right: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Eye toggle button */}
                        <button
                          type="button"
                          onClick={() => setShowAccountPassword(prev => !prev)}
                          title={showAccountPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                          aria-label={showAccountPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            border: 'none',
                            background: showAccountPassword ? '#E2E8F0' : 'transparent',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.92rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <i className={`fa-regular ${showAccountPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>

                        {/* Pencil focus button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (passwordInputRef.current) {
                              passwordInputRef.current.focus()
                              passwordInputRef.current.select()
                            }
                          }}
                          title="Wachtwoord aanpassen"
                          aria-label="Wachtwoord aanpassen"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#243B6B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.92rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <i className="fa-solid fa-pencil" />
                        </button>
                      </div>
                    </div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                      Klik op het oogje om het wachtwoord te bekijken of op het potloodje om het aan te passen.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={savingAccount || !editAccountName.trim()}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      backgroundColor: '#243B6B',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      border: 'none',
                      cursor: savingAccount ? 'wait' : 'pointer',
                    }}
                  >
                    {savingAccount ? 'Opslaan…' : `Account ${editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'} Opslaan`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, borderTop: '2px solid #E2E8F0', paddingTop: 20 }}>
          <button
            type="button"
            onClick={handleSavePortalSettings}
            disabled={saving}
            style={{
              padding: '12px 32px',
              backgroundColor: '#162544',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 900,
              cursor: saving ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(22, 37, 68, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {saving ? 'Opslaan…' : '💾 Wijzigingen Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
