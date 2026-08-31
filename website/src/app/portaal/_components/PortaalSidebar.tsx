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
  const [displayName, setDisplayName] = useState(naam)

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

  // Collapsible menu state
  const isWebsiteRoute = pathname.startsWith('/portaal/instellingen') || pathname.startsWith('/portaal/leidingbeheer')
  const isWebshopRoute = pathname.startsWith('/portaal/webshop')

  const [websiteBeheerOpen, setWebsiteBeheerOpen] = useState(isWebsiteRoute)
  const [webshopBeheerOpen, setWebshopBeheerOpen] = useState(isWebshopRoute)

  useEffect(() => {
    if (isWebsiteRoute) setWebsiteBeheerOpen(true)
    if (isWebshopRoute) setWebshopBeheerOpen(true)
  }, [pathname, isWebsiteRoute, isWebshopRoute])

  // Regular Navigation Items (Kriko Echo, Documenten, Agenda)
  const standardNavItems = [
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
                {isWebshop ? 'Webshop' : 'Leidingsportaal'}
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

            {/* Webshop Direct Navigation Items (Voor Webshop rol: enkel Bestellingen & Artikelen, géén dropdown) */}
            {isWebshop && (
              <>
                <Link
                  href="/portaal/webshop/bestellingen"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.92rem',
                    fontWeight: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? 800 : 600,
                    color: '#FFFFFF',
                    background: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '#243B6B' : 'transparent',
                    boxShadow: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  className={`portaal-sidebar-item ${(pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-box-archive" style={{
                    fontSize: '1rem',
                    width: 20,
                    textAlign: 'center',
                    color: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  }}></i>
                  <span>Bestellingen</span>
                </Link>

                <Link
                  href="/portaal/webshop/artikelen"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.92rem',
                    fontWeight: pathname === '/portaal/webshop/artikelen' ? 800 : 600,
                    color: '#FFFFFF',
                    background: pathname === '/portaal/webshop/artikelen' ? '#243B6B' : 'transparent',
                    boxShadow: pathname === '/portaal/webshop/artikelen' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  className={`portaal-sidebar-item ${pathname === '/portaal/webshop/artikelen' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-shirt" style={{
                    fontSize: '1rem',
                    width: 20,
                    textAlign: 'center',
                    color: pathname === '/portaal/webshop/artikelen' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  }}></i>
                  <span>Artikelen</span>
                </Link>
              </>
            )}

            {/* Standard Nav Items (Voor Leiding & Groepsleiding) */}
            {!isWebshop && standardNavItems.map((item) => (
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

            {/* Collapsible: Website Beheer (Voor Groepsleiding) */}
            {isGroepsleiding && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  type="button"
                  onClick={() => setWebsiteBeheerOpen(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  className="portaal-sidebar-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className="fa-solid fa-globe" style={{
                      fontSize: '1rem',
                      width: 20,
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.75)',
                    }}></i>
                    <span>Website Beheer</span>
                  </div>
                  <i
                    className={`fa-solid fa-chevron-down`}
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      transition: 'transform 0.2s ease',
                      transform: websiteBeheerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  ></i>
                </button>

                {/* Submenu Website Beheer */}
                {websiteBeheerOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, marginTop: 2 }}>
                    <Link
                      href="/?edit=true"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.88)',
                        transition: 'all 0.15s ease',
                      }}
                      className="portaal-sidebar-item"
                    >
                      <i className="fa-solid fa-pen-to-square" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Live Bewerken</span>
                    </Link>

                    <Link
                      href="/portaal/leidingbeheer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: pathname === '/portaal/leidingbeheer' ? 800 : 600,
                        color: '#FFFFFF',
                        background: pathname === '/portaal/leidingbeheer' ? '#243B6B' : 'transparent',
                        boxShadow: pathname === '/portaal/leidingbeheer' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className={`portaal-sidebar-item ${pathname === '/portaal/leidingbeheer' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-users-line" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: pathname === '/portaal/leidingbeheer' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Leidingsbeheer</span>
                    </Link>

                    <Link
                      href="/portaal/instellingen"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: pathname === '/portaal/instellingen' ? 800 : 600,
                        color: '#FFFFFF',
                        background: pathname === '/portaal/instellingen' ? '#243B6B' : 'transparent',
                        boxShadow: pathname === '/portaal/instellingen' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className={`portaal-sidebar-item ${pathname === '/portaal/instellingen' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-sliders" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: pathname === '/portaal/instellingen' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Portaal Instellingen</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible: Webshop Beheer (Enkel voor Groepsleiding) */}
            {isGroepsleiding && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  type="button"
                  onClick={() => setWebshopBeheerOpen(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  className="portaal-sidebar-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className="fa-solid fa-store" style={{
                      fontSize: '1rem',
                      width: 20,
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.75)',
                    }}></i>
                    <span>Webshop Beheer</span>
                  </div>
                  <i
                    className={`fa-solid fa-chevron-down`}
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      transition: 'transform 0.2s ease',
                      transform: webshopBeheerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  ></i>
                </button>

                {/* Submenu Webshop Beheer */}
                {webshopBeheerOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, marginTop: 2 }}>
                    
                    {/* 1. Bestellingen */}
                    <Link
                      href="/portaal/webshop/bestellingen"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? 800 : 600,
                        color: '#FFFFFF',
                        background: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '#243B6B' : 'transparent',
                        boxShadow: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className={`portaal-sidebar-item ${(pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-box-archive" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: (pathname === '/portaal/webshop/bestellingen' || pathname === '/portaal/webshop') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Bestellingen</span>
                    </Link>

                    {/* 2. Artikelen */}
                    <Link
                      href="/portaal/webshop/artikelen"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: pathname === '/portaal/webshop/artikelen' ? 800 : 600,
                        color: '#FFFFFF',
                        background: pathname === '/portaal/webshop/artikelen' ? '#243B6B' : 'transparent',
                        boxShadow: pathname === '/portaal/webshop/artikelen' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className={`portaal-sidebar-item ${pathname === '/portaal/webshop/artikelen' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-shirt" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: pathname === '/portaal/webshop/artikelen' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Artikelen</span>
                    </Link>

                    {/* 3. Instellingen (Enkel zichtbaar voor Groepsleiding) */}
                    <Link
                      href="/portaal/webshop/instellingen"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: pathname === '/portaal/webshop/instellingen' ? 800 : 600,
                        color: '#FFFFFF',
                        background: pathname === '/portaal/webshop/instellingen' ? '#243B6B' : 'transparent',
                        boxShadow: pathname === '/portaal/webshop/instellingen' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className={`portaal-sidebar-item ${pathname === '/portaal/webshop/instellingen' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-gear" style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', color: pathname === '/portaal/webshop/instellingen' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}></i>
                      <span>Instellingen</span>
                    </Link>

                  </div>
                )}
              </div>
            )}

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
                          <Link
                            href="/portaal/instellingen"
                            onClick={() => setProfileDropdownOpen(false)}
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
                              textDecoration: 'none',
                              boxSizing: 'border-box',
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
                          </Link>
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
    </>
  )
}
