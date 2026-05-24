/**
 * TeaKart service worker.
 *
 * Bump CACHE_VERSION whenever the offline-fallback HTML or precache list
 * changes — old caches are flushed on activate.
 *
 * Strategy:
 *   - Pre-cache `/`, `/products`, and `/offline` on install.
 *   - Navigations to public paths: network-first; on success, refresh the
 *     cache for any URL in the precache list. On failure: try the exact
 *     URL from cache → fall back to `/` (homepage shell) → fall back to
 *     `/offline`.
 *   - Static assets (`/_next/static/*`, `/icons/*`, `/logo.svg`,
 *     `/manifest.json`): cache-first. These are content-hashed (or
 *     stable), so once cached they're safe to serve forever; cache-first
 *     means a previously-visited page can render fully when offline.
 *   - /admin, /api, /account, /checkout, /order, and auth paths: bypass
 *     the SW entirely. Caching anything user-scoped risks leaking another
 *     user's data after sign-out.
 */

const CACHE_VERSION = 'teakart-v2'
const PRECACHE_URLS = ['/', '/products', '/offline']

// Navigation paths that should never go through the SW — either dynamic
// per-user, or hide-sensitive-state-on-cache, or we just want them to
// always be fresh.
const NAVIGATION_BYPASS_PREFIXES = [
  '/admin',
  '/api',
  '/account',
  '/checkout',
  '/order',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/complete-profile',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION)
      // allSettled so one slow / failed page doesn't block install.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { credentials: 'omit' })
            if (res.ok) await cache.put(url, res)
          } catch {
            // Skip — the page can still be cached on first runtime visit.
          }
        }),
      )
    })(),
  )
  // Activate the new SW immediately rather than waiting for old tabs to close.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // GET only — never cache mutations.
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Cross-origin (Cloudinary, Google Fonts, etc.) — let the browser handle.
  if (url.origin !== self.location.origin) return

  // Static assets: cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.svg' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation: network-first with offline fallback chain.
  if (request.mode === 'navigate') {
    if (NAVIGATION_BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return
    }
    event.respondWith(networkFirstNavigation(request, url.pathname))
    return
  }

  // Everything else (e.g. data fetches) — pass through.
})

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh.ok) {
      // Don't await — let the put happen in the background.
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch {
    return new Response('', { status: 504, statusText: 'Gateway Timeout' })
  }
}

async function networkFirstNavigation(request, pathname) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const fresh = await fetch(request)
    // Keep the precached shells fresh.
    if (fresh.ok && PRECACHE_URLS.includes(pathname)) {
      cache.put(pathname, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch {
    // 1. Exact URL from cache (if previously visited).
    const exact = await cache.match(request)
    if (exact) return exact
    // 2. Homepage shell — at least show branded chrome.
    const home = await cache.match('/')
    if (home) return home
    // 3. Generic offline page.
    const offline = await cache.match('/offline')
    if (offline) return offline
    // 4. Last resort.
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}
