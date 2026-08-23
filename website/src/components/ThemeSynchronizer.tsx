'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'

export default function ThemeSynchronizer() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const isPortaal = pathname === '/portaal' || pathname.startsWith('/portaal/')
    const themeColor = isPortaal ? '#162544' : '#650B19'

    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]')
    if (metaThemeColors.length > 0) {
      metaThemeColors.forEach(el => el.setAttribute('content', themeColor))
    } else {
      const metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      metaThemeColor.setAttribute('content', themeColor)
      document.head.appendChild(metaThemeColor)
    }

    if (isPortaal) {
      document.documentElement.classList.add('portal-theme', 'portaal')
      document.body.classList.add('portal-theme', 'portaal')
      document.documentElement.style.background = '#162544'
      document.documentElement.style.backgroundColor = '#162544'
      document.body.style.backgroundColor = '#D9D9D9'
    } else {
      document.documentElement.classList.remove('portal-theme', 'portaal')
      document.body.classList.remove('portal-theme', 'portaal')
      document.documentElement.style.background = ''
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = 'var(--color-bg-linen)'
    }
  }, [pathname])

  return null
}
