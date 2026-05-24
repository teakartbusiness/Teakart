import type { ColorTokenKey } from '@/theme.config'

type ColorBag = Partial<Record<ColorTokenKey, string>>

function oklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

function rnd(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate a coherent random palette. The light + dark variants share the
 * same hue family so they look like the same brand, just inverted. Chroma
 * is kept moderate so colors stay readable; foregrounds always invert the
 * lightness of their pairing surface to maintain contrast.
 */
export function randomPalette(): { light: ColorBag; dark: ColorBag } {
  // Primary hue — pick a fresh one, avoid neon-yellow zones.
  const hue = rnd(0, 360)
  // Chroma keeps the palette tasteful — not too saturated.
  const surfaceChroma = rnd(0.005, 0.025)
  const primaryChroma = rnd(0.06, 0.14)

  const light: ColorBag = {
    /* Surface */
    'background':         oklch(0.98,  surfaceChroma * 0.7, hue),
    'surface-muted':      oklch(0.96,  surfaceChroma,        hue),
    'surface-sunken':     oklch(0.93,  surfaceChroma * 1.5,  hue),
    'foreground':         oklch(0.22,  surfaceChroma * 2,    hue),
    'text-strong':        oklch(0.18,  surfaceChroma * 2,    hue),
    'text-subtle':        oklch(0.58,  surfaceChroma * 1.5,  hue),
    'muted':              oklch(0.94,  surfaceChroma,        hue),
    'muted-foreground':   oklch(0.5,   surfaceChroma * 1.5,  hue),
    'border':             oklch(0.86,  surfaceChroma * 1.5,  hue),
    'border-strong':      oklch(0.76,  surfaceChroma * 2,    hue),

    /* Brand */
    'primary':            oklch(rnd(0.28, 0.42), primaryChroma,        hue),
    'primary-foreground': oklch(0.97,  surfaceChroma * 0.7,  hue),
    'accent':             oklch(0.92,  primaryChroma * 0.3,  hue),
    'accent-foreground':  oklch(0.22,  primaryChroma * 0.6,  hue),
  }

  const dark: ColorBag = {
    /* Surface (dark variant — invert lightness) */
    'background':         oklch(0.17,  surfaceChroma * 2,    hue),
    'surface-muted':      oklch(0.21,  surfaceChroma * 2,    hue),
    'surface-sunken':     oklch(0.24,  surfaceChroma * 2.2,  hue),
    'foreground':         oklch(0.94,  surfaceChroma * 1.5,  hue),
    'text-strong':        oklch(0.97,  surfaceChroma * 1.5,  hue),
    'text-subtle':        oklch(0.62,  surfaceChroma * 1.5,  hue),
    'muted':              oklch(0.27,  surfaceChroma * 2,    hue),
    'muted-foreground':   oklch(0.72,  surfaceChroma * 1.5,  hue),
    'border':             oklch(0.32,  surfaceChroma * 2.5,  hue),
    'border-strong':      oklch(0.43,  surfaceChroma * 3,    hue),

    /* Brand (dark variant — light primary against dark surface) */
    'primary':            oklch(rnd(0.78, 0.88), primaryChroma * 0.8,  hue),
    'primary-foreground': oklch(0.2,   primaryChroma * 0.6,  hue),
    'accent':             oklch(0.28,  primaryChroma * 0.5,  hue),
    'accent-foreground':  oklch(0.92,  primaryChroma * 0.4,  hue),
  }

  return { light, dark }
}
