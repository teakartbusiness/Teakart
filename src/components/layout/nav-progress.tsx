'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Global top loading bar. Fires the instant any same-origin navigation starts
 * (a link/Link click, or browser back/forward) and completes when the route
 * actually changes. This guarantees immediate "something is happening" feedback
 * on EVERY navigation, regardless of how fast the destination renders — the
 * per-route loading.tsx skeletons still show for genuinely slow loads.
 *
 * Purely presentational: it never calls preventDefault, so navigation proceeds
 * exactly as before. No logic affected.
 */
function NavProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const trickle = useRef<number | null>(null)
  const active = useRef(false)

  // Start on navigation intent.
  useEffect(() => {
    function start() {
      if (active.current) return
      active.current = true
      setVisible(true)
      setProgress(8)
      trickle.current = window.setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.12) : p))
      }, 180)
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || anchor.hasAttribute('download')) return
      const target = anchor.getAttribute('target')
      if (target && target !== '_self') return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Same page (hash-only or identical) — no real navigation.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      start()
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', start)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', start)
      if (trickle.current) window.clearInterval(trickle.current)
    }
  }, [])

  // Complete when the route (path or query) changes.
  useEffect(() => {
    if (!active.current) return
    if (trickle.current) {
      window.clearInterval(trickle.current)
      trickle.current = null
    }
    setProgress(100)
    const hide = window.setTimeout(() => setVisible(false), 220)
    const reset = window.setTimeout(() => {
      setProgress(0)
      active.current = false
    }, 450)
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(reset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition: 'width 180ms ease',
          boxShadow: '0 0 8px var(--primary), 0 0 4px var(--primary)',
        }}
      />
    </div>
  )
}

export default function NavProgress() {
  // useSearchParams must sit under a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <NavProgressInner />
    </Suspense>
  )
}
