'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Popover } from 'radix-ui'

interface Props {
  value: string
  onChange: (next: string) => void
  ariaLabel?: string
}

/**
 * Best-effort conversion of any CSS color (oklch, hsl, named, hex) into a
 * `#rrggbb` string for the hex picker UI. Uses a canvas, so it falls back to
 * the previous valid hex if the browser can't parse the input.
 */
function toHex(value: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const r = v[1], g = v[2], b = v[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return fallback
    ctx.fillStyle = '#000000'
    ctx.fillStyle = v
    const parsed = ctx.fillStyle as string
    if (/^#[0-9a-f]{6}$/i.test(parsed)) return parsed.toLowerCase()
    return fallback
  } catch {
    return fallback
  }
}

export default function ColorPicker({ value, onChange, ariaLabel }: Props) {
  const [hex, setHex] = useState<string>(() => toHex(value, '#000000'))
  const lastValueRef = useRef(value)

  // When the parent value changes (e.g. Reset, or typing in the text input),
  // re-sync the picker's hex so the swatch keeps matching.
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value
      setHex(toHex(value, hex))
    }
  }, [value, hex])

  const id = useId()

  function handleHexChange(next: string) {
    setHex(next)
    onChange(next)
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? 'Pick color'}
          className="group/swatch flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border ring-offset-background transition-shadow hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: value }}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[240px] rounded-2xl border border-border bg-card p-3 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="color-picker-wrapper">
            <HexColorPicker color={hex} onChange={handleHexChange} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hex</span>
            <span className="text-text-subtle">#</span>
            <HexColorInput
              id={id}
              color={hex}
              onChange={handleHexChange}
              prefixed={false}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
