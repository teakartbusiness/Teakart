'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Mode = 'light' | 'dark'

const STORAGE_KEY = 'teakart-theme-mode'

function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyMode(mode: Mode) {
  if (typeof document === 'undefined') return
  if (mode === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

type Variant = 'icon' | 'row'

export default function ThemeToggle({
  variant = 'icon',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>('light')

  useEffect(() => {
    const initial = getInitialMode()
    setMode(initial)
    applyMode(initial)
    setMounted(true)
  }, [])

  function toggle() {
    const next: Mode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    applyMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage might be disabled in some browsers — fail silently.
    }
  }

  if (variant === 'row') {
    // Mobile drawer row — full-width, label + icon, styled to match other
    // menu items. Render an invisible placeholder until mounted to avoid
    // showing the wrong label on first paint.
    if (!mounted) {
      return (
        <div
          aria-hidden
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground opacity-0 ${className ?? ''}`}
        >
          <span>Dark mode</span>
          <Moon className="size-4" />
        </div>
      )
    }
    const nextLabel = mode === 'dark' ? 'Light mode' : 'Dark mode'
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${nextLabel.toLowerCase()}`}
        className={`rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted ${className ?? ''}`}
      >
        {nextLabel}
      </button>
    )
  }

  // Render a static placeholder until mounted so we don't show the wrong icon
  // on first paint (causes a hydration jitter).
  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className={`inline-flex size-10 items-center justify-center rounded-lg opacity-0 ${className ?? ''}`}
      >
        <Sun className="size-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
      className={`inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted ${className ?? ''}`}
    >
      {mode === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
