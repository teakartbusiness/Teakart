'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Local (not UTC) yyyy-mm-dd for a Date — avoids timezone off-by-one. */
function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today + n days, as a local yyyy-mm-dd. */
export function todayPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toIso(d)
}

/** Shift an iso date string by ±days; empty falls back to today first. */
function shiftIso(iso: string, days: number): string {
  const base = iso ? new Date(`${iso}T00:00:00`) : new Date()
  base.setDate(base.getDate() + days)
  return toIso(base)
}

/**
 * Estimated-delivery date control: prev/next day arrows flanking a native
 * date input (which gives the calendar-picker icon AND direct typing for free),
 * plus an optional Clear. Callers seed the value (e.g. today+7) — see todayPlus.
 */
export default function DeliveryDateInput({
  value,
  onChange,
  disabled,
  min = todayPlus(0),
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  /** Earliest selectable date (defaults to today). Pass '' to allow past dates. */
  min?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(shiftIso(value, -1))}
        disabled={disabled}
        aria-label="Previous day"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <ChevronLeft className="size-4" />
      </button>

      <input
        type="date"
        value={value}
        min={min || undefined}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <button
        type="button"
        onClick={() => onChange(shiftIso(value, 1))}
        disabled={disabled}
        aria-label="Next day"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
