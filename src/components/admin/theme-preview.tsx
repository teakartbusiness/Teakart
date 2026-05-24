'use client'

import { useMemo } from 'react'
import { COLOR_TOKEN_NAMES, type ThemeDefaultKey, type ThemeMode } from '@/theme.config'
import { TYPOGRAPHY_TOKEN_SET, getFontChoice } from '@/lib/theme/tokens'

interface Props {
  /** Fully-resolved token values for the mode being shown (already merged with defaults). */
  resolved: Record<ThemeDefaultKey, string>
  /** Which mode this preview represents — just for the label. */
  mode: ThemeMode
}

/**
 * Renders a self-contained sample of the UI using the supplied token values
 * as inline CSS variables on its root. Children just reference `var(--…)`
 * and pick up whichever values the admin currently has in the form — no
 * save required.
 *
 * Wrapped in a div with explicit color/bg so the preview looks like the
 * mode it represents even when the rest of the admin page is in the other
 * mode.
 */
export default function ThemePreview({ resolved, mode }: Props) {
  // Build the style object: every color token becomes a CSS custom property
  // on this scoped container. Font tokens are resolved through getFontChoice
  // so we send the actual font stack, not the Google Fonts key.
  const style = useMemo(() => {
    const out: Record<string, string> = {}
    for (const name of COLOR_TOKEN_NAMES) {
      const v = resolved[name]
      if (v) out[`--${name}`] = v
    }
    for (const fontKey of ['font-sans', 'font-display', 'font-mono'] as const) {
      const v = resolved[fontKey]
      if (!v) continue
      const stack = getFontChoice(v)?.stack
      if (stack) out[`--${fontKey}`] = stack
    }
    const baseSize = resolved['base-font-size']
    if (baseSize && TYPOGRAPHY_TOKEN_SET.has('base-font-size')) {
      out['fontSize'] = baseSize
    }
    // Background + text on the wrapper itself so the preview looks isolated
    // from the surrounding admin page.
    out.backgroundColor = `var(--background)`
    out.color = `var(--foreground)`
    return out
  }, [resolved])

  return (
    <div
      style={style}
      className="overflow-hidden rounded-2xl border ring-1 ring-border"
    >
      <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>
          {mode === 'dark' ? 'Dark mode preview' : 'Light mode preview'}
        </p>
      </div>

      <div className="space-y-5 p-5" style={{ fontFamily: 'var(--font-sans)' }}>
        <h3
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-display)' }}
        >
          Sample product
        </h3>
        <p style={{ color: 'var(--foreground)' }}>
          A short description giving a feel of the product copy on a real listing.
        </p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Ships across India · Manual delivery
        </p>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Buy now
          </button>
          <button
            type="button"
            className="rounded-xl border px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              borderColor: 'var(--border)',
            }}
          >
            View details
          </button>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Pill bg="--status-pending-bg" fg="--status-pending-fg" ring="--status-pending-ring">
            Pending
          </Pill>
          <Pill bg="--status-confirmed-bg" fg="--status-confirmed-fg" ring="--status-confirmed-ring">
            Confirmed
          </Pill>
          <Pill bg="--status-shipped-bg" fg="--status-shipped-fg" ring="--status-shipped-ring">
            Shipped
          </Pill>
          <Pill bg="--status-delivered-bg" fg="--status-delivered-fg" ring="--status-delivered-ring">
            Delivered
          </Pill>
          <Pill bg="--status-cancelled-bg" fg="--status-cancelled-fg" ring="--status-cancelled-ring">
            Cancelled
          </Pill>
        </div>

        {/* Card / surface sample */}
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>
            Customer note
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--foreground)' }}>
            Lovely piece, arrived earlier than expected.
          </p>
        </div>
      </div>
    </div>
  )
}

function Pill({
  bg,
  fg,
  ring,
  children,
}: {
  bg: string
  fg: string
  ring: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
      style={{
        backgroundColor: `var(${bg})`,
        color: `var(${fg})`,
        // ring-color is set via the ring class + inline color trick
        boxShadow: `inset 0 0 0 1px var(${ring})`,
      }}
    >
      {children}
    </span>
  )
}
