'use client'

import { useEffect } from 'react'

/**
 * Registers /sw.js so the site is installable on Chrome/Android and falls
 * back to the offline page when there's no network. Disabled in dev because
 * service workers cache aggressively and mess with hot reload.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // Don't surface this to the user — it just means PWA features are off.
        console.warn('Service worker registration failed:', err)
      })
    }

    // Defer so the SW doesn't compete with initial page load.
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
