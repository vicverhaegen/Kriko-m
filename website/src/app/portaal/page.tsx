'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const ROLES = [
  { id: 'leiding', label: 'Leiding' },
  { id: 'groepsleiding', label: 'Groepsleiding' },
  { id: 'webshop', label: 'Webshop & uniformen' },
] as const

type RoleType = typeof ROLES[number]['id']

export default function PortaalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#D9D9D9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-finaal.png" alt="Kriko-M laden…" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#162544', fontFamily: 'var(--font-heading), sans-serif' }}>Laden...</div>
      </div>
    }>
      <PortaalContent />
    </Suspense>
  )
}

function PortaalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedRole, setSelectedRole] = useState<RoleType>('leiding')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const [loginBgUrl, setLoginBgUrl] = useState('/images/hero-nieuw.webp')

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.portal_login_foto) {
            setLoginBgUrl(data.portal_login_foto)
          }
        }
      } catch {}
    }
    loadSettings()
  }, [])

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const role = session.user.app_metadata?.role || ''
          const defaultTarget = role === 'webshop' ? '/portaal/webshop/bestellingen' : '/portaal/home'
          const target = searchParams.get('redirect') || defaultTarget
          router.replace(target)
          return
        }
      } catch {
        // Fallthrough to login form
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [supabase, router, searchParams])

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('⚠️ Geen toegang: Je account heeft onvoldoende rechten om die pagina te bekijken. Log in met het juiste account.')
    }
  }, [searchParams])

  useEffect(() => {
    if (!roleDropdownOpen) return
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [roleDropdownOpen])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!password) {
      setError('Vul een wachtwoord in.')
      return
    }

    setStatus('loading')
    setError('')

    const targetEmail = selectedRole === 'leiding' 
      ? 'leiding@kriko-m.be' 
      : selectedRole === 'groepsleiding'
      ? 'groepsleiding@kriko-m.be'
      : 'webshop@kriko-m.be'

    try {
      // Ensure accounts exist in Supabase Auth
      await fetch('/api/auth/ensure-accounts', { method: 'POST' })

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      })

      if (authError) {
        setError(authError.message || 'Ongeldig wachtwoord voor gekozen rol.')
        setStatus('idle')
      } else {
        const defaultTarget = selectedRole === 'webshop' ? '/portaal/webshop/bestellingen' : '/portaal/home'
        const target = searchParams.get('redirect') || defaultTarget
        router.push(target)
        router.refresh()
      }
    } catch {
      setError('Er is een fout opgetreden bij het inloggen.')
      setStatus('idle')
    }
  }

  const currentRoleObj = ROLES.find(r => r.id === selectedRole) || ROLES[0]

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', background: '#D9D9D9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-finaal.png" alt="Kriko-M laden…" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#162544', fontFamily: 'var(--font-heading), sans-serif' }}>Laden...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundImage: `url(${loginBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 24, fontFamily: 'var(--font-body, Outfit, sans-serif)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.65) 0%, rgba(36, 59, 107, 0.75) 100%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
        <Image src="/images/logo-finaal.png" alt="Kriko-M logo" width={68} height={68} style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
        <div style={{ lineHeight: 1.2 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-heading, Nunito, sans-serif)', fontWeight: 900, fontSize: '2rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Kriko-M</span>
        </div>
      </div>

      {/* Card - overflow must remain visible for iOS WebKit touch responders */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #243B6B' }}>
        <div style={{ padding: '36px 36px 38px' }}>
          <div style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)', fontSize: '1.4rem', fontWeight: 900, color: '#162544', marginBottom: 22, textAlign: 'center' }}>Inloggen op het Portaal</div>

          {error && <div style={{ padding: '12px 14px', borderRadius: 12, fontSize: '.88rem', fontWeight: 600, textAlign: 'center', marginBottom: 20, background: 'rgba(178,58,77,0.08)', border: '1.5px solid #B23A4D', color: '#B23A4D' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Minimalist Custom Account Selector Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: '#162544', marginBottom: 8 }}>
                Selecteer Account
              </label>

              <button
                type="button"
                onClick={() => setRoleDropdownOpen(prev => !prev)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: roleDropdownOpen ? '1.5px solid #243B6B' : '1.5px solid #D9D9D9',
                  background: '#FFFFFF',
                  color: '#162544',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: roleDropdownOpen ? '0 0 0 3px rgba(36, 59, 107, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{currentRoleObj.label}</span>
                <i className="fa-solid fa-chevron-down" style={{
                  color: '#64748B',
                  fontSize: '0.78rem',
                  transition: 'transform 0.2s ease',
                  transform: roleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}></i>
              </button>

              {/* Popover Dropdown Menu */}
              {roleDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #E2E8F0',
                    padding: '4px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    animation: 'dropdownFadeIn 0.15s ease-out',
                  }}
                >
                  {ROLES.map((role) => {
                    const isSelected = role.id === selectedRole
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.id)
                          setRoleDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: isSelected ? 'rgba(36, 59, 107, 0.08)' : 'transparent',
                          color: isSelected ? '#243B6B' : '#162544',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                        }}
                        className="portaal-login-role-option"
                      >
                        <span>{role.label}</span>
                        {isSelected && (
                          <i className="fa-solid fa-check" style={{ color: '#243B6B', fontSize: '0.82rem' }}></i>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="portal-password" style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: '#162544', marginBottom: 8 }}>
                Wachtwoord
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="portal-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="portaal-input"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{
                    fontSize: '16px',
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                    WebkitTouchCallout: 'default',
                    touchAction: 'manipulation',
                    cursor: 'text',
                    paddingRight: 44,
                    backgroundColor: '#FFFFFF',
                    color: '#162544',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="portaal-btn-primary" style={{ width: '100%', padding: '14px', marginTop: 8, fontSize: '0.95rem' }}>
              {status === 'loading' ? 'Inloggen…' : `Inloggen als ${currentRoleObj.label} →`}
            </button>
          </form>
        </div>
      </div>

      <Link href="/" style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', background: 'rgba(0,0,0,0.25)', padding: '8px 16px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
        ← Terug naar de publieke website
      </Link>
    </div>
  )
}
