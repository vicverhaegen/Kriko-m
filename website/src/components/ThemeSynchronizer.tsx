'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'

export default function ThemeSynchronizer() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const isPortaal = pathname === '/portaal' || pathname.startsWith('/portaal/')

    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    if (isPortaal) {
      document.body.classList.add('portal-theme', 'portaal')
      document.documentElement.style.background = '#162544'
      document.documentElement.style.backgroundColor = '#162544'
      document.body.style.backgroundColor = '#D9D9D9'
      metaThemeColor.setAttribute('content', '#162544')
    } else {
      document.body.classList.remove('portal-theme', 'portaal')
      document.documentElement.style.background = ''
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = 'var(--color-bg-linen)'
      metaThemeColor.setAttribute('content', '#650B19')
    }
  }, [pathname])

  return null
}
