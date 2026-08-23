'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Props {
  naam: string
  role?: string
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

interface AccountInfo {
  id: string | null
  role: 'leiding' | 'groepsleiding' | 'webshop'
  email: string
  naam: string
}

export default function PortaalSidebar({ naam, role, mobileOpen = false, onCloseMobile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isGroepsleiding = role === 'admin' || role === 'groepsleiding'
  const isWebshop = role === 'webshop'

  const roleLabel = isWebshop
    ? 'Webshop'
    : isGroepsleiding
    ? 'Groepsleiding'
    : 'Leiding'

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [displayName, setDisplayName] = useState(naam)

  // Account Management State (Groepsleiding)
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [editingRole, setEditingRole] = useState<'leiding' | 'groepsleiding' | 'webshop'>('leiding')
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  const onCloseMobileRef = useRef(onCloseMobile)
  useEffect(() => {
    onCloseMobileRef.current = onCloseMobile
  })

  // Only close mobile sidebar and profile dropdown when navigating to a new page
  useEffect(() => {
    onCloseMobileRef.current?.()
    setProfileDropdownOpen(false)
  }, [pathname])

  useEffect(() => {
    setDisplayName(naam)
  }, [naam])

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.naam) {
        setDisplayName(user.user_metadata.naam)
      }
    }
    loadUser()
  }, [supabase])

  useEffect(() => {
    if (!profileDropdownOpen) return
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.portaal-sidebar-profile-container')) {
        setProfileDropdownOpen(false)
      }
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [profileDropdownOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    try { localStorage.removeItem('kriko_cart') } catch {}
    router.push('/portaal')
    router.refresh()
  }

  async function openAccountModal() {
    setProfileDropdownOpen(false)
    setShowAccountsModal(true)
    setLoadingAccounts(true)
    setModalError('')
    setModalSuccess('')

    try {
      const res = await fetch('/api/admin/accounts')
      const data = await res.json()
      if (data.accounts) {
        setAccounts(data.accounts)
        const target = data.accounts.find((a: AccountInfo) => a.role === editingRole)
        if (target) setEditName(target.naam)
      }
    } catch {
      setModalError('Kon accountgegevens niet laden.')
    } finally {
      setLoadingAccounts(false)
    }
  }

  function handleSelectRoleToEdit(roleType: 'leiding' | 'groepsleiding' | 'webshop') {
    setEditingRole(roleType)
    setEditPassword('')
    setModalError('')
    setModalSuccess('')
    const target = accounts.find(a => a.role === roleType)
    if (target) setEditName(target.naam)
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    setSavingAccount(true)
    setModalError('')
    setModalSuccess('')

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editingRole,
          newName: editName,
          newPassword: editPassword || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setModalError(data.error || 'Fout bij opslaan van account.')
      } else {
        const roleLbl = editingRole === 'leiding' ? 'Leiding' : editingRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'
        setModalSuccess(`Account voor ${roleLbl} succesvol bijgewerkt!`)
        setEditPassword('')
        const listRes = await fetch('/api/admin/accounts')
        const listData = await listRes.json()
        if (listData.accounts) setAccounts(listData.accounts)
        router.refresh()
      }
    } catch {
      setModalError('Netwerkfout bij opslaan.')
    } finally {
      setSavingAccount(false)
    }
  }

  // Navigation Items (REMOVED 'Overzicht' as requested, clicking top-left brand goes to /portaal/home!)
  const navItems = [
    {
      href: '/portaal/echos',
      label: 'Kriko Echo',
      icon: 'fa-solid fa-newspaper',
      active: pathname === '/portaal/echos',
      show: !isWebshop,
    },
    {
      href: '/portaal/algemene-info',
      label: 'Documenten & Links',
      icon: 'fa-solid fa-folder-open',
      active: pathname === '/portaal/algemene-info',
      show: !isWebshop,
    },
    {
      href: '/portaal/leiding/agenda',
      label: 'Agenda',
      icon: 'fa-solid fa-calendar-days',
      active: pathname === '/portaal/leiding/agenda',
      show: !isWebshop,
    },
    {
      href: '/portaal/website-beheer',
      label: 'Website Beheer',
      icon: 'fa-solid fa-globe',
      active: pathname === '/portaal/website-beheer',
      show: isGroepsleiding,
    },
    {
      href: '/portaal/webshop/bestellingen',
      label: 'Webshop Bestellingen',
      icon: 'fa-solid fa-box-archive',
      active: pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop',
      show: isWebshop || isGroepsleiding,
    },
    {
      href: '/portaal/webshop/artikelen',
      label: 'Webshop Artikelen',
      icon: 'fa-solid fa-shirt',
      active: pathname === '/portaal/webshop/artikelen',
      show: isGroepsleiding,
    },
  ].filter(item => item.show)

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 140,
          }}
          className="portaal-mobile-backdrop"
        />
      )}

      <aside
        className={`portaal-dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 260,
          minWidth: 260,
          height: '100dvh',
          maxHeight: '100dvh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: '#162544',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 150,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Section with Brand and Scrollable Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <Link
              href={isWebshop ? "/portaal/webshop/bestellingen" : "/portaal/home"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
              }}
              title="Naar homepagina"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-finaal.png"
                alt="Kriko-M"
                width={36}
                height={36}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
              <span style={{
                fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.01em',
                lineHeight: 1.1,
              }}>
                Leidingsportaal
              </span>
            </Link>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="portaal-mobile-close-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Scrollable Navigation Section */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.55)',
              padding: '4px 12px',
              marginBottom: 2,
              flexShrink: 0,
            }}>
              Navigatie
            </span>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: item.active ? 800 : 600,
                  color: '#FFFFFF',
                  background: item.active ? '#243B6B' : 'transparent',
                  boxShadow: item.active ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                className={`portaal-sidebar-item ${item.active ? 'active' : ''}`}
              >
                <i className={item.icon} style={{
                  fontSize: '1rem',
                  width: 20,
                  textAlign: 'center',
                  color: item.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                }}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Section: User Profile button + Square 'Back to Home' button side-by-side */}
        {(() => {
          const nameToShow = displayName || (isWebshop ? 'Webshop' : isGroepsleiding ? 'Groepsleiding' : 'Leiding')
          const showRoleSubtitle = nameToShow.toLowerCase().trim() !== roleLabel.toLowerCase().trim()

          return (
            <div style={{
              padding: '14px 12px calc(16px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative',
              flexShrink: 0,
              background: '#162544',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                
                {/* User Profile Button linksonder */}
                <div className="portaal-sidebar-profile-container" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => setProfileDropdownOpen(prev => !prev)}
                    style={{
                      width: '100%',
                      height: 44,
                      boxSizing: 'border-box',
                      background: profileDropdownOpen ? '#243B6B' : 'rgba(255, 255, 255, 0.08)',
                      padding: '0 12px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: profileDropdownOpen ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#FFFFFF',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: profileDropdownOpen ? '0 4px 14px rgba(0, 0, 0, 0.3)' : 'none',
                    }}
                    title="Account opties"
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: profileDropdownOpen ? 'rgba(255, 255, 255, 0.2)' : '#243B6B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}>
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, justifyContent: 'center' }}>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                      }}>
                        {nameToShow}
                      </span>
                      {showRoleSubtitle && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'rgba(255, 255, 255, 0.75)',
                          lineHeight: 1.1,
                        }}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <i className="fa-solid fa-chevron-up" style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.75rem',
                      transition: 'transform 0.2s ease',
                      transform: profileDropdownOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                      flexShrink: 0,
                    }}></i>
                  </button>

                  {/* Profile Dropdown Popover */}
                  {profileDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 10px)',
                        left: 0,
                        width: 236,
                        background: '#FFFFFF',
                        borderRadius: 16,
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        zIndex: 160,
                        color: '#162544',
                        animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* Header Info */}
                      <div style={{ padding: '14px 18px', background: '#F8FAF8', borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                          Ingelogd als
                        </span>
                        <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', lineHeight: 1.25 }}>
                          {nameToShow}
                        </strong>
                      </div>

                      {/* Actions List */}
                      <div style={{ padding: '8px' }}>
                        {isGroepsleiding && (
                          <button
                            onClick={openAccountModal}
                            className="portaal-dropdown-btn"
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'none',
                              border: 'none',
                              color: '#162544',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: 'rgba(36, 59, 107, 0.08)',
                              color: '#243B6B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              flexShrink: 0,
                            }}>
                              <i className="fa-solid fa-users-gear"></i>
                            </div>
                            <span>Accountbeheer</span>
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="portaal-dropdown-btn-danger"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: 'rgba(220, 38, 38, 0.08)',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}>
                            <i className="fa-solid fa-right-from-bracket"></i>
                          </div>
                          <span>Uitloggen</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vierkante knop met huis + pijl icoon (Terug naar publieke website) */}
                <Link
                  href="/"
                  title="Terug naar publieke website"
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  className="portaal-sidebar-back-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 21H5a2 2 0 0 1-2-2V10l9-7 9 7v9a2 2 0 0 1-2 2h-3"></path>
                    <polyline points="11 15 8 12 11 9"></polyline>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </Link>

              </div>
            </div>
          )
        })()}
      </aside>

      {/* Account Management Modal for Groepsleiding */}
      {showAccountsModal && (
        <div className="portaal-modal-overlay">
          <div className="portaal-modal-card" style={{ maxWidth: 540 }}>
            <div className="portaal-modal-header" style={{ borderBottom: '1px solid #D9D9D9' }}>
              <h3 className="portaal-modal-title" style={{ color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                👥 Accountbeheer — Rollen &amp; Wachtwoorden
              </h3>
              <button className="portaal-modal-close" onClick={() => setShowAccountsModal(false)}>&times;</button>
            </div>
            
            {loadingAccounts ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', fontWeight: 600 }}>Accounts laden…</div>
            ) : (
              <form onSubmit={handleSaveAccount}>
                <div className="portaal-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {modalError && <div className="portaal-modal-alert error">{modalError}</div>}
                  {modalSuccess && <div className="portaal-modal-alert success">{modalSuccess}</div>}

                  <div style={{ fontSize: '0.86rem', color: '#666' }}>
                    Selecteer hieronder het account dat je wilt bewerken (naam of wachtwoord aanpassen):
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleToEdit('leiding')}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: editingRole === 'leiding' ? '2px solid #243B6B' : '1px solid #D9D9D9',
                        background: editingRole === 'leiding' ? '#EBF0F9' : '#FFFFFF',
                        color: editingRole === 'leiding' ? '#243B6B' : '#1A1A1A',
                        fontWeight: editingRole === 'leiding' ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      Leiding
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleToEdit('groepsleiding')}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: editingRole === 'groepsleiding' ? '2px solid #243B6B' : '1px solid #D9D9D9',
                        background: editingRole === 'groepsleiding' ? '#EBF0F9' : '#FFFFFF',
                        color: editingRole === 'groepsleiding' ? '#243B6B' : '#1A1A1A',
                        fontWeight: editingRole === 'groepsleiding' ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      Groepsleiding
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleToEdit('webshop')}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: editingRole === 'webshop' ? '2px solid #243B6B' : '1px solid #D9D9D9',
                        background: editingRole === 'webshop' ? '#EBF0F9' : '#FFFFFF',
                        color: editingRole === 'webshop' ? '#243B6B' : '#1A1A1A',
                        fontWeight: editingRole === 'webshop' ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      Webshop
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Weergavenaam voor {editingRole === 'leiding' ? 'Leiding' : editingRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'}:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      placeholder="Bijv. Leiding Kriko-M"
                      disabled={savingAccount}
                      style={{ borderRadius: 8, borderColor: '#D9D9D9' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nieuw Wachtwoord (laat leeg om ongewijzigd te laten):</label>
                    <input
                      type="password"
                      className="form-control"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Nieuw wachtwoord (minstens 6 tekens)"
                      disabled={savingAccount}
                      style={{ borderRadius: 8, borderColor: '#D9D9D9' }}
                    />
                  </div>
                </div>

                <div className="portaal-modal-footer" style={{ borderTop: '1px solid #D9D9D9' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAccountsModal(false)}
                    disabled={savingAccount}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: 8, borderColor: '#D9D9D9', color: '#1A1A1A' }}
                  >
                    Sluiten
                  </button>
                  <button
                    type="submit"
                    disabled={savingAccount || !editName.trim()}
                    style={{
                      padding: '8px 20px',
                      fontSize: '0.9rem',
                      borderRadius: 8,
                      background: '#162544',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {savingAccount ? 'Opslaan…' : 'Wijzigingen Opslaan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
