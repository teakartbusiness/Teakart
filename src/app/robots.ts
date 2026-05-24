import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

/**
 * Crawl rules. Anything customer-private or admin-only is blocked outright.
 * Public storefront pages are crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products', '/products/'],
        disallow: [
          '/admin',
          '/admin/',
          '/account',
          '/account/',
          '/checkout',
          '/order/',
          '/sign-in',
          '/sign-up',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
