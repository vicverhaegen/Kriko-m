'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'

interface Props {
  naam: string
  role?: string
  onToggleMobileSidebar?: () => void
}

interface AccountInfo {
  id: string | null
  role: 'leiding' | 'groepsleiding' | 'webshop'
  email: string
  naam: string
}

export default function PortaalNav({ naam, role, onToggleMobileSidebar }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isGroepsleiding = role === 'admin' || role === 'groepsleiding'
  const isWebshop = role === 'webshop'

  const [dropdownOpen, setDropdownOpen] = useState(false)
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

  useEffect(() => {
    setDropdownOpen(false)
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

  // Click outside listener for profile dropdown
  useEffect(() => {
    if (!dropdownOpen) return
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.portaal-profile-container')) {
        setDropdownOpen(false)
      }
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [dropdownOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    try { localStorage.removeItem('kriko_cart') } catch {}
    router.push('/portaal')
    router.refresh()
  }

  async function openAccountModal() {
    setDropdownOpen(false)
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
        const roleLabel = editingRole === 'leiding' ? 'Leiding' : editingRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'
        setModalSuccess(`Account voor ${roleLabel} succesvol bijgewerkt!`)
        setEditPassword('')
        // Refresh accounts list
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

  // Determine current page title / breadcrumb
  const getPageTitle = () => {
    if (pathname === '/portaal/home' || pathname === '/portaal/leiding') return 'Overzicht'
    if (pathname === '/portaal/echos') return 'Kriko Echo Beheer'
    if (pathname === '/portaal/algemene-info') return 'Documenten & Links'
    if (pathname === '/portaal/leiding/agenda') return 'Agenda'
    if (pathname.startsWith('/portaal/instellingen')) return 'Portaalinstellingen'
    if (pathname === '/portaal/webshop/artikelen') return 'Webshop Artikelen'
    if (pathname === '/portaal/webshop/instellingen') return 'Webshop Instellingen'
    if (pathname.startsWith('/portaal/webshop')) return 'Webshop Bestellingen'
    return 'Leidingportaal'
  }

  return (
    <>
      <header
        style={{
          height: 64,
          background: '#FFFFFF',
          borderBottom: '1px solid #EDE8D0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Left Side: Mobile Menu Button & Page Title Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="portaal-mobile-toggle-btn"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: '1px solid #EDE8D0',
                background: '#F0ECE4',
                color: '#650B19',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
              }}
              title="Open menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(345, 10%, 45%)' }}>
              {isWebshop ? 'Webshop' : 'Leidingportaal'}
            </span>
            <span style={{ color: 'hsl(345, 10%, 45%)', fontSize: '0.8rem' }}>/</span>
            <h1 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#3a0710',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}>
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Side: Quick User Icon / Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="portaal-profile-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              title="Account menu"
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 14px 6px 8px',
                borderRadius: 24,
                background: dropdownOpen ? '#F9F0F2' : '#F0ECE4',
                color: '#1A1A1A',
                border: '1px solid #EDE8D0',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#650B19',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 800,
              }}>
                <i className="fa-solid fa-user"></i>
              </div>
              <span className="portaal-user-name-text">
                {displayName || (isWebshop ? 'Webshop' : isGroepsleiding ? 'Groepsleiding' : 'Leiding')}
              </span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.75rem', color: 'hsl(345, 10%, 45%)', marginLeft: 2 }}></i>
            </button>

            {dropdownOpen && (
              <div
                className="portaal-profile-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 230,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  boxShadow: '0 10px 28px rgba(0,0,0,0.1)',
                  border: '1px solid #EDE8D0',
                  overflow: 'hidden',
                  zIndex: 120,
                  animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Account Info Header */}
                <div style={{ padding: '14px 16px', background: '#F9F0F2', borderBottom: '1px solid #EDE8D0' }}>
                  <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#650B19', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ingelogd als
                  </span>
                  <strong style={{ display: 'block', fontSize: '.96rem', fontWeight: 800, color: '#3a0710', marginTop: 2, fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    {displayName || (isWebshop ? 'Webshop & uniformen' : isGroepsleiding ? 'Groepsleiding' : 'Leiding')}
                  </strong>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: '0.72rem', fontWeight: 700, color: '#650B19', background: 'rgba(101, 11, 25, 0.1)', padding: '2px 8px', borderRadius: 8 }}>
                    {isWebshop ? 'Webshop & uniformen' : isGroepsleiding ? 'Groepsleiding' : 'Leiding'}
                  </span>
                </div>

                <div style={{ padding: '6px' }}>
                  {isGroepsleiding && (
                    <button
                      onClick={openAccountModal}
                      className="portaal-dropdown-item"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'none',
                        border: 'none',
                        color: '#1A1A1A',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <i className="fa-solid fa-users-gear" style={{ color: '#650B19' }}></i>
                      <span>Accountbeheer</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="portaal-dropdown-item"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      color: '#650B19',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Uitloggen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Account Management Modal for Groepsleiding */}
      {showAccountsModal && (
        <div className="portaal-modal-overlay">
          <div className="portaal-modal-card" style={{ maxWidth: 540 }}>
            <div className="portaal-modal-header" style={{ borderBottom: '1px solid #EDE8D0' }}>
              <h3 className="portaal-modal-title" style={{ color: '#3a0710', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                👥 Accountbeheer — Rollen &amp; Wachtwoorden
              </h3>
              <button className="portaal-modal-close" onClick={() => setShowAccountsModal(false)}>&times;</button>
            </div>
            
            {loadingAccounts ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'hsl(345, 10%, 45%)', fontWeight: 600 }}>Accounts laden…</div>
            ) : (
              <form onSubmit={handleSaveAccount}>
                <div className="portaal-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {modalError && <div className="portaal-modal-alert error">{modalError}</div>}
                  {modalSuccess && <div className="portaal-modal-alert success">{modalSuccess}</div>}

                  <div style={{ fontSize: '0.86rem', color: 'hsl(345, 10%, 45%)' }}>
                    Selecteer hieronder het account dat je wilt bewerken (naam of wachtwoord aanpassen):
                  </div>

                  {/* Selector between the 3 accounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleToEdit('leiding')}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: editingRole === 'leiding' ? '2px solid #650B19' : '1px solid #EDE8D0',
                        background: editingRole === 'leiding' ? '#F9F0F2' : '#FFFFFF',
                        color: editingRole === 'leiding' ? '#650B19' : '#1A1A1A',
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
                        border: editingRole === 'groepsleiding' ? '2px solid #650B19' : '1px solid #EDE8D0',
                        background: editingRole === 'groepsleiding' ? '#F9F0F2' : '#FFFFFF',
                        color: editingRole === 'groepsleiding' ? '#650B19' : '#1A1A1A',
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
                        border: editingRole === 'webshop' ? '2px solid #650B19' : '1px solid #EDE8D0',
                        background: editingRole === 'webshop' ? '#F9F0F2' : '#FFFFFF',
                        color: editingRole === 'webshop' ? '#650B19' : '#1A1A1A',
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
                      style={{ borderRadius: 8, borderColor: '#EDE8D0' }}
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
                      style={{ borderRadius: 8, borderColor: '#EDE8D0' }}
                    />
                  </div>
                </div>

                <div className="portaal-modal-footer" style={{ borderTop: '1px solid #EDE8D0' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAccountsModal(false)}
                    disabled={savingAccount}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: 8, borderColor: '#EDE8D0', color: '#1A1A1A' }}
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
                      background: '#650B19',
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
