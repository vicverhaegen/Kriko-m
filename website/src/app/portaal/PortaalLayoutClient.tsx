'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PortaalSidebar from './_components/PortaalSidebar'

interface Props {
  children: React.ReactNode
  naam: string
  role?: string
  settings?: import('@/lib/types').Settings | null
}

export default function PortaalLayoutClient({ children, naam, role, settings }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleCloseMobile = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [])

  const showNav = pathname !== '/portaal' && pathname !== '/portaal/'
  const isHomePage = pathname === '/portaal/home' || pathname === '/portaal/leiding' || pathname === '/portaal/home/' || pathname === '/portaal/leiding/'

  const homeBgUrl = settings?.home_leiding_foto || '/images/leiding_25-26.jpg'

  // Clear website edit mode whenever navigating inside the portal
  useEffect(() => {
    try {
      sessionStorage.removeItem('kriko_edit_mode')
      localStorage.removeItem('kriko_edit_mode')
    } catch {}
  }, [])

  const canvasBgColor = '#D9D9D9' // Lichtgrijs theme color for portaal canvas

  useEffect(() => {
    if (!showNav) return
    document.documentElement.style.background = '#162544'
    document.documentElement.style.backgroundColor = '#162544'
    document.body.style.backgroundColor = canvasBgColor
    document.body.style.backgroundImage = ''
    return () => {
      document.body.style.backgroundImage = ''
    }
  }, [showNav, canvasBgColor])

  useEffect(() => {
    if (!showNav) return

    const handleGlobalClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      const target = anchor.getAttribute('target')
      if (target === '_blank') return

      const download = anchor.getAttribute('download')
      if (download !== null) return

      if (href.startsWith('#') || (href.includes('#') && href.split('#')[0] === window.location.pathname)) return

      try {
        const targetUrl = new URL(href, window.location.origin)
        const targetPathAndQuery = targetUrl.pathname + targetUrl.search
        const currentUrl = window.location.pathname + window.location.search

        if (targetUrl.origin === window.location.origin && targetPathAndQuery.startsWith('/portaal')) {
          if (targetPathAndQuery !== currentUrl) {
            e.preventDefault()
            startTransition(() => {
              router.push(href)
            })
          }
        }
      } catch {
        // ignore
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [showNav, router])

  const getPageTitle = (path: string) => {
    if (path === '/portaal/echos') return 'Kriko Echo'
    if (path === '/portaal/algemene-info') return 'Documenten & Links'
    if (path === '/portaal/leiding/agenda') return 'Kalender & Activiteiten'
    if (path.startsWith('/portaal/instellingen')) return 'Portaalinstellingen'
    if (path === '/portaal/webshop/artikelen') return 'Webshop Artikelen'
    if (path === '/portaal/webshop/instellingen') return 'Webshop Instellingen'
    if (path.startsWith('/portaal/webshop')) return 'Webshop Bestellingen'
    return 'Leidingsportaal'
  }

  return (
    <>
      {showNav ? (
        <div className="portaal-dashboard-shell">
          <PortaalSidebar
            naam={naam}
            role={role}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={handleCloseMobile}
          />

          {/* Floating Hamburger Toggle Button for Mobile Screens */}
          <button
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="portaal-mobile-floating-toggle"
            style={{
              position: 'fixed',
              top: 13,
              left: 14,
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#162544',
              color: '#FFFFFF',
              border: 'none',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
              zIndex: 135,
            }}
            title="Open menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div
            className="portaal-dashboard-content-area"
            style={{
              backgroundColor: isHomePage ? '#162544' : '#D9D9D9',
              position: 'relative',
              minHeight: '100vh',
              minWidth: 0,
              width: '100%',
            }}
          >
            {isHomePage && (
              <>
                {/* Leidingsfoto achtergrondafbeelding */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${homeBgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0,
                  }}
                />
                {/* Donkerblauwe filter overlay (zoals op het inlogscherm) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.45) 0%, rgba(36, 59, 107, 0.55) 100%)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    zIndex: 1,
                  }}
                />
              </>
            )}

            {/* Topbar: Rendered on ALL pages EXCEPT home/overzicht! */}
            {!isHomePage && (
              <header
                className="portaal-topbar-header"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 260,
                  right: 0,
                  height: 64,
                  background: '#FFFFFF',
                  borderBottom: '1px solid #CCCCCC',
                  padding: '0 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  zIndex: 100,
                  transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  gap: 12,
                }}
              >
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(1.02rem, 3.2vw, 1.35rem)',
                  fontWeight: 900,
                  color: '#162544',
                  fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {getPageTitle(pathname)}
                </h1>

                <div id="portaal-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }} />
              </header>
            )}

            <main
              className="portaal-page-main portaal-page-main--anchor"
              style={{
                width: '100%',
                backgroundColor: isHomePage ? 'transparent' : '#D9D9D9',
                minHeight: isHomePage ? '100vh' : 'calc(100vh - 64px)',
                paddingTop: isHomePage ? 0 : 64,
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {children}
              {isPending && (
                <div
                  className="portaal-loading-overlay"
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 260,
                    right: 0,
                    bottom: 0,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    background: 'rgba(22, 37, 68, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 110,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo-finaal.png" alt="" aria-hidden="true" style={{ width: 64, height: 64, objectFit: 'contain', animation: 'portaal-pulse 1.5s infinite ease-in-out' }} />
                    <div style={{ width: 120, height: 4, background: 'rgba(255, 255, 255, 0.25)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', height: '100%', width: '50%', background: '#FFFFFF', borderRadius: 2, animation: 'portaal-loading-bar 1.2s infinite ease-in-out' }} />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  )
}
