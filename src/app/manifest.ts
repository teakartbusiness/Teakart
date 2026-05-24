import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ede2cc',
    theme_color: '#3b2c20',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/logo_192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/logo_512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        // Icon has built-in margin (safe zone), so Android adaptive icons can
        // crop ~10% per side without clipping the artwork.
        src: '/logo_512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}
