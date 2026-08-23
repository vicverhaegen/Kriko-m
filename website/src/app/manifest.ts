import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scouts Kriko-M Sint-Niklaas',
    short_name: 'Kriko-M',
    description: 'Scouts Kriko-M uit Sint-Niklaas — Takken, kalender, Kriko Echo, verhuur en webshop.',
    start_url: '/',
    display: 'standalone',
    background_color: '#650B19',
    theme_color: '#650B19',
    icons: [
      {
        src: '/images/app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
