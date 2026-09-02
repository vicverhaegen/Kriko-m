'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentPathRef = useRef(pathname)

  // Reset/complete when route changes
  useEffect(() => {
    currentPathRef.current = pathname

    // If timer was running (navigation finished before 750ms), cancel it completely
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current)
      animIntervalRef.current = null
    }

    // If bar was visible, complete it quickly then hide
    if (visible) {
      setProgress(100)
      const hideTimer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 250)
      return () => clearTimeout(hideTimer)
    }
  }, [pathname, searchParams, visible])

  // Global click interceptor for internal navigation links
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Ignore modified clicks (new tab, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return
      }

      // Find closest anchor tag
      const anchor = (e.target as HTMLElement)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Ignore external, anchor links, mailto, tel, downloads
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.hasAttribute('download') ||
        anchor.getAttribute('target') === '_blank'
      ) {
        return
      }

      // Strip query/hash to compare with current pathname
      const targetPath = href.split('?')[0].split('#')[0]
      if (targetPath === currentPathRef.current && !href.includes('?')) {
        // Same page link
        return
      }

      // Cancel any existing timer
      if (timerRef.current) clearTimeout(timerRef.current)
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)

      // Start 750ms threshold timer: ONLY show bar if navigation takes longer than 750ms
      timerRef.current = setTimeout(() => {
        setVisible(true)
        setProgress(25)

        // Incrementally advance progress up to 90% while waiting for page
        animIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev
            // Slow down as it approaches 90%
            const increment = Math.max(1, (90 - prev) * 0.15)
            return Math.min(90, prev + increment)
          })
        }, 200)
      }, 750)
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
      if (timerRef.current) clearTimeout(timerRef.current)
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        zIndex: 999999,
        pointerEvents: 'none',
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--color-primary, #650B19) 0%, var(--color-accent, #C9963A) 50%, var(--color-accent-light, #E2C58D) 100%)',
          boxShadow: '0 0 10px rgba(201, 150, 58, 0.7), 0 0 5px rgba(101, 11, 25, 0.5)',
          transition: progress === 100 ? 'width 150ms ease-out, opacity 250ms ease-out' : 'width 200ms ease-out',
          opacity: visible ? 1 : 0,
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}

export default function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  )
}
