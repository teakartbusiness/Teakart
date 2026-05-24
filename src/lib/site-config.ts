/**
 * Site-wide constants used by metadata, sitemaps, robots.txt, and OG cards.
 * The URL falls back to localhost for dev. In production, set
 * NEXT_PUBLIC_SITE_URL to the full canonical origin (e.g. https://teakart.in).
 */
export const siteConfig = {
  name: 'TeaKart',
  description: 'Thoughtfully curated goods — shop the collection.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
} as const

export type SiteConfig = typeof siteConfig
