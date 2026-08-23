'use client'
import { useEffect, useLayoutEffect, useRef } from 'react'

export default function LoadingScreen() {
  const ref = useRef<HTMLDivElement>(null)

  // Synchronously hide immediately if already seen in current session
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      if (sessionStorage.getItem('kriko_seen')) {
        el.style.display = 'none'
      }
    } catch {}
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      if (sessionStorage.getItem('kriko_seen')) {
        el.style.display = 'none'
        return
      }
      sessionStorage.setItem('kriko_seen', '1')
    } catch {}

    const timer = setTimeout(() => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transition = 'opacity 0.4s ease'
      setTimeout(() => {
        if (el) el.style.display = 'none'
      }, 400)
    }, 1100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={ref} id="loading-screen" aria-hidden="true" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo-finaal.png" alt="Kriko-M laden…" />
      <div className="loading-bar-wrap"><div className="loading-bar"></div></div>
    </div>
  )
}
