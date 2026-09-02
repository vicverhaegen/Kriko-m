'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import LoadingScreen from './LoadingScreen'
import { useScrollLock } from '@/lib/useScrollLock'

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [takkenOpen, setTakkenOpen] = useState(false)

  useScrollLock(menuOpen)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTakkenClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      e.preventDefault()
      e.stopPropagation()
      setTakkenOpen((prev) => !prev)
    }
  }

  return (
    <>
      <LoadingScreen />

      {/* Hoofdnavigatie */}
      <header className="site-header">
        <nav className={`mainnav${menuOpen ? ' nav-open' : ''}`} id="mainnav">
          <div className="mainnav-inner">
            <Link href="/" className="nav-logo" onClick={handleLogoClick}>
              <Image src="/images/logo-finaal.png" alt="Kriko-M logo" width={140} height={140} priority unoptimized />
            </Link>
            <ul className="nav-links">
              <li><Link href="/info" className={isActive('/info') ? 'nav-active' : ''}>INFO</Link></li>
              <li
                className={`has-dropdown${takkenOpen ? ' open' : ''}`}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth <= 992) {
                    setTakkenOpen((prev) => !prev)
                  }
                }}
              >
                <Link
                  href="/takken"
                  className={isActive('/takken') ? 'nav-active' : ''}
                  onClick={handleTakkenClick}
                >
                  TAKKEN <span className="arrow">{takkenOpen ? '▲' : '▼'}</span>
                </Link>
                <ul className="dropdown">
                  <li><Link href="/takken/kapoenen">Kapoenen</Link></li>
                  <li><Link href="/takken/welpen">Welpen</Link></li>
                  <li><Link href="/takken/jonggivers">Jonggivers</Link></li>
                  <li><Link href="/takken/givers">Givers</Link></li>
                </ul>
              </li>
              <li><Link href="/echos" className={isActive('/echos') ? 'nav-active' : ''}>KRIKO ECHO</Link></li>
              <li><Link href="/kalender" className={isActive('/kalender') ? 'nav-active' : ''}>KALENDER</Link></li>
              <li><Link href="/shop" className={isActive('/shop') ? 'nav-active' : ''}>UNIFORMEN</Link></li>
              <li><Link href="/verhuur" className={isActive('/verhuur') ? 'nav-active' : ''}>VERHUUR</Link></li>
              <li className="nav-mobile-only">
                <Link href="/inschrijven" className={isActive('/inschrijven') ? 'nav-active' : ''}>INSCHRIJVEN</Link>
              </li>
            </ul>
            <Link href="/inschrijven" className="nav-cta">INSCHRIJVEN</Link>
            <button
              className="nav-hamburger"
              id="nav-hamburger"
              aria-label="Menu openen"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>
      </header>

      {/* GDPR Cookiebanner */}
      <CookieBanner />
    </>
  )
}

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('kriko_cookies')
    if (!accepted) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div id="cookie-banner" role="dialog" aria-label="Cookie-melding">
      <span className="cookie-icon">🍪</span>
      <div className="cookie-text">
        <p>
          Scouts Kriko-M gebruikt enkel <strong>functionele cookies</strong> om je winkelmandje, voorkeuren en instellingen te onthouden — geen tracking of advertenties. Meer in onze{' '}
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>privacyverklaring</Link>.
        </p>
        <div className="cookie-actions">
          <button className="cookie-btn-accept" onClick={() => { localStorage.setItem('kriko_cookies', 'yes'); setVisible(false) }}>
            Begrepen
          </button>
        </div>
      </div>
    </div>
  )
}
