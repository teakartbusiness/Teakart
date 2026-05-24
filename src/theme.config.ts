/**
 * =============================================================================
 * THEME CONFIG — single source of truth for default colors, fonts, and sizes.
 * =============================================================================
 *
 * Two ways to change the look of the site:
 *   1. Visit /admin/customize — values you set there override the defaults
 *      here and are stored in the `theme_settings` table. Each color has a
 *      light + dark variant; visitors switch with the header toggle.
 *   2. Edit this file directly — the values you set here apply when nothing is
 *      saved on /admin/customize (clicking "Reset" on a token also brings the
 *      site back to whatever is in this file).
 *
 * If you edit a default here, also update the matching value in
 * src/app/globals.css under `:root` (light defaults) or `.dark` (dark
 * defaults). Tailwind needs the CSS-variable defaults at build time.
 *
 * Colors use OKLCH for perceptual uniformity, but the customization UI
 * accepts any valid CSS color value, including `#rrggbb`.
 */

export type ThemeMode = 'light' | 'dark'

/* ----- Light-mode color defaults -----
 *
 * Matches the brand wordmark in public/logo.svg: warm cream background,
 * deep coffee-brown text. Earthy, soft, residential. Pick "Monochrome"
 * from the presets list for the classic black-on-white look. */
const COLORS_LIGHT_RAW = {
  /* Brand */
  'primary':                'oklch(0.30 0.045 50)',
  'primary-foreground':     'oklch(0.96 0.018 80)',
  'accent':                 'oklch(0.91 0.035 75)',
  'accent-foreground':      'oklch(0.28 0.045 55)',
  'logo-color':             'oklch(0.30 0.045 50)',

  /* Surface — cream lifted slightly to play nicely with the logo's bg */
  'background':             'oklch(0.955 0.018 78)',
  'foreground':             'oklch(0.28 0.04 55)',
  'surface-muted':          'oklch(0.93 0.022 75)',
  'surface-sunken':         'oklch(0.90 0.026 72)',
  'text-strong':            'oklch(0.22 0.045 50)',
  'text-subtle':            'oklch(0.55 0.03 60)',
  'muted':                  'oklch(0.92 0.024 75)',
  'muted-foreground':       'oklch(0.48 0.035 55)',
  'border':                 'oklch(0.86 0.026 70)',
  'border-strong':          'oklch(0.74 0.032 65)',

  /* Semantic — warm-tinted to harmonize with the earth palette */
  'destructive':            'oklch(0.56 0.20 28)',
  'destructive-foreground': 'oklch(0.96 0.018 80)',
  'destructive-soft':       'oklch(0.93 0.06 30)',
  'success':                'oklch(0.60 0.14 145)',
  'success-foreground':     'oklch(0.96 0.018 80)',
  'success-soft':           'oklch(0.92 0.06 140)',
  'warning':                'oklch(0.66 0.15 75)',
  'warning-foreground':     'oklch(0.22 0.06 60)',
  'warning-soft':           'oklch(0.93 0.08 85)',
  'warning-ring':           'oklch(0.82 0.10 75)',

  /* Order status — warm-tinted backgrounds so they blend with cream */
  'status-pending-bg':      'oklch(0.93 0.08 85)',
  'status-pending-fg':      'oklch(0.40 0.13 70)',
  'status-pending-ring':    'oklch(0.86 0.10 80)',
  'status-confirmed-bg':    'oklch(0.92 0.05 235)',
  'status-confirmed-fg':    'oklch(0.40 0.15 250)',
  'status-confirmed-ring':  'oklch(0.84 0.07 235)',
  'status-shipped-bg':      'oklch(0.91 0.05 195)',
  'status-shipped-fg':      'oklch(0.42 0.13 195)',
  'status-shipped-ring':    'oklch(0.84 0.07 195)',
  'status-delivered-bg':    'oklch(0.92 0.06 145)',
  'status-delivered-fg':    'oklch(0.40 0.13 150)',
  'status-delivered-ring':  'oklch(0.83 0.08 145)',
  'status-cancelled-bg':    'oklch(0.92 0.06 28)',
  'status-cancelled-fg':    'oklch(0.45 0.18 28)',
  'status-cancelled-ring':  'oklch(0.84 0.08 30)',
} as const

const COLORS_LIGHT: Record<keyof typeof COLORS_LIGHT_RAW, string> = COLORS_LIGHT_RAW

/* ----- Dark-mode color defaults -----
 *
 * Aim: a calm near-neutral gray with just a faint warm hint so it still
 * feels related to the light theme, but isn't aggressively coffee-tinted.
 * Status colors stay vivid (they're a deliberate signal).               */
const COLORS_DARK: Record<keyof typeof COLORS_LIGHT_RAW, string> = {
  /* Brand */
  'primary':                'oklch(0.88 0.018 75)',
  'primary-foreground':     'oklch(0.20 0.008 75)',
  'accent':                 'oklch(0.28 0.008 70)',
  'accent-foreground':      'oklch(0.92 0.006 80)',
  'logo-color':             'oklch(0.93 0.008 80)',

  /* Surface — near-neutral with the faintest warm bias */
  'background':             'oklch(0.18 0.005 75)',
  'foreground':             'oklch(0.94 0.004 80)',
  'surface-muted':          'oklch(0.21 0.006 75)',
  'surface-sunken':         'oklch(0.24 0.007 75)',
  'text-strong':            'oklch(0.97 0.003 80)',
  'text-subtle':            'oklch(0.62 0.005 75)',
  'muted':                  'oklch(0.27 0.007 75)',
  'muted-foreground':       'oklch(0.74 0.004 80)',
  'border':                 'oklch(0.32 0.008 75)',
  'border-strong':          'oklch(0.43 0.010 75)',

  /* Semantic */
  'destructive':            'oklch(0.65 0.20 28)',
  'destructive-foreground': 'oklch(0.20 0.005 75)',
  'destructive-soft':       'oklch(0.30 0.10 28)',
  'success':                'oklch(0.70 0.15 145)',
  'success-foreground':     'oklch(0.20 0.005 75)',
  'success-soft':           'oklch(0.28 0.08 145)',
  'warning':                'oklch(0.74 0.16 75)',
  'warning-foreground':     'oklch(0.20 0.005 75)',
  'warning-soft':           'oklch(0.28 0.10 85)',
  'warning-ring':           'oklch(0.55 0.15 80)',

  /* Order status — keep hue, lift fg/ring, sink bg for dark surfaces */
  'status-pending-bg':      'oklch(0.28 0.08 85)',
  'status-pending-fg':      'oklch(0.90 0.10 85)',
  'status-pending-ring':    'oklch(0.42 0.10 85)',
  'status-confirmed-bg':    'oklch(0.27 0.08 240)',
  'status-confirmed-fg':    'oklch(0.85 0.10 240)',
  'status-confirmed-ring':  'oklch(0.40 0.10 240)',
  'status-shipped-bg':      'oklch(0.28 0.08 195)',
  'status-shipped-fg':      'oklch(0.85 0.10 195)',
  'status-shipped-ring':    'oklch(0.40 0.10 195)',
  'status-delivered-bg':    'oklch(0.28 0.08 150)',
  'status-delivered-fg':    'oklch(0.85 0.10 150)',
  'status-delivered-ring':  'oklch(0.40 0.10 150)',
  'status-cancelled-bg':    'oklch(0.30 0.09 28)',
  'status-cancelled-fg':    'oklch(0.85 0.12 28)',
  'status-cancelled-ring':  'oklch(0.45 0.12 28)',
}

/* ----- Typography (shared across both modes) ----- */
const TYPOGRAPHY = {
  'font-sans':       'Geist',
  'font-display':    'Geist',
  'font-mono':       'Geist Mono',
  'base-font-size':  '17px',
} as const

/* Names exported for the type system. */
export type ColorTokenKey = keyof typeof COLORS_LIGHT_RAW
export type TypographyTokenKey = keyof typeof TYPOGRAPHY
export type ThemeDefaultKey = ColorTokenKey | TypographyTokenKey

export const COLOR_TOKEN_NAMES: ColorTokenKey[] = Object.keys(COLORS_LIGHT_RAW) as ColorTokenKey[]
export const TYPOGRAPHY_TOKEN_NAMES: TypographyTokenKey[] = Object.keys(TYPOGRAPHY) as TypographyTokenKey[]

/**
 * Full defaults per mode. Typography is duplicated into each so a single
 * `resolveTokens(mode)` call can return everything needed.
 */
export const THEME_DEFAULTS: Record<ThemeMode, Record<ThemeDefaultKey, string>> = {
  light: { ...COLORS_LIGHT, ...TYPOGRAPHY },
  dark:  { ...COLORS_DARK,  ...TYPOGRAPHY },
}

/* If you tweak these visual rhythm values, update src/app/globals.css too. */
export const RADIUS_BASE = '0.75rem'                          // ≈ 12px — used for cards, dialogs


/* ============================================================
 * PRESETS — curated palettes the admin can apply in one click.
 * Each preset overrides COLORS only (typography stays).
 * ============================================================ */

export interface ThemePreset {
  id: string
  name: string
  description: string
  light: Partial<Record<ColorTokenKey, string>>
  dark: Partial<Record<ColorTokenKey, string>>
}

/**
 * Each preset overrides the most visible tokens. Anything not listed stays
 * at the default defined above. The intent is "broad palette swap" rather
 * than "set every single status pill" — the order-status palette stays
 * coherent across presets by reusing default amber/blue/violet/green/red.
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Minimal black and white — the classic.',
    light: {
      'primary':                'oklch(0.205 0 0)',
      'primary-foreground':     'oklch(0.985 0 0)',
      'accent':                 'oklch(0.97 0 0)',
      'accent-foreground':      'oklch(0.205 0 0)',
      'background':             'oklch(1 0 0)',
      'foreground':             'oklch(0.145 0 0)',
      'surface-muted':          'oklch(0.985 0 0)',
      'surface-sunken':         'oklch(0.97 0 0)',
      'text-strong':            'oklch(0.145 0 0)',
      'text-subtle':            'oklch(0.708 0 0)',
      'muted':                  'oklch(0.97 0 0)',
      'muted-foreground':       'oklch(0.556 0 0)',
      'border':                 'oklch(0.922 0 0)',
      'border-strong':          'oklch(0.85 0 0)',
      'destructive':            'oklch(0.577 0.245 27.325)',
      'destructive-foreground': 'oklch(0.985 0 0)',
      'destructive-soft':       'oklch(0.96 0.04 25)',
      'success':                'oklch(0.62 0.16 145)',
      'success-foreground':     'oklch(0.985 0 0)',
      'success-soft':           'oklch(0.96 0.04 145)',
      'warning':                'oklch(0.65 0.16 75)',
      'warning-foreground':     'oklch(0.2 0.05 75)',
      'warning-soft':           'oklch(0.96 0.06 95)',
      'warning-ring':           'oklch(0.85 0.1 85)',
    },
    dark: {
      'primary':                'oklch(0.92 0 0)',
      'primary-foreground':     'oklch(0.18 0 0)',
      'accent':                 'oklch(0.27 0.003 240)',
      'accent-foreground':      'oklch(0.92 0 0)',
      'background':             'oklch(0.17 0.003 240)',
      'foreground':             'oklch(0.95 0 0)',
      'surface-muted':          'oklch(0.20 0.003 240)',
      'surface-sunken':         'oklch(0.22 0.003 240)',
      'text-strong':            'oklch(0.98 0 0)',
      'text-subtle':            'oklch(0.6 0 0)',
      'muted':                  'oklch(0.25 0.003 240)',
      'muted-foreground':       'oklch(0.72 0 0)',
      'border':                 'oklch(0.30 0.003 240)',
      'border-strong':          'oklch(0.40 0.003 240)',
      'destructive':            'oklch(0.68 0.20 25)',
      'destructive-foreground': 'oklch(0.18 0 0)',
      'destructive-soft':       'oklch(0.32 0.10 25)',
      'success':                'oklch(0.72 0.15 145)',
      'success-foreground':     'oklch(0.18 0 0)',
      'success-soft':           'oklch(0.30 0.08 145)',
      'warning':                'oklch(0.74 0.16 75)',
      'warning-foreground':     'oklch(0.18 0 0)',
      'warning-soft':           'oklch(0.30 0.10 85)',
      'warning-ring':           'oklch(0.55 0.15 80)',
    },
  },
  {
    id: 'linen',
    name: 'Linen',
    description: 'Warm beige and brown — softer, more residential.',
    light: {
      'background':         'oklch(0.985 0.012 80)',
      'surface-muted':      'oklch(0.97 0.015 80)',
      'surface-sunken':     'oklch(0.95 0.018 75)',
      'foreground':         'oklch(0.25 0.025 60)',
      'text-strong':        'oklch(0.22 0.03 55)',
      'text-subtle':        'oklch(0.6 0.025 70)',
      'muted':              'oklch(0.95 0.018 75)',
      'muted-foreground':   'oklch(0.5 0.025 60)',
      'border':             'oklch(0.88 0.025 70)',
      'border-strong':      'oklch(0.78 0.03 65)',
      'primary':            'oklch(0.35 0.06 55)',
      'primary-foreground': 'oklch(0.97 0.015 80)',
      'accent':             'oklch(0.93 0.03 75)',
      'accent-foreground':  'oklch(0.25 0.03 55)',
    },
    dark: {
      'background':         'oklch(0.18 0.02 60)',
      'surface-muted':      'oklch(0.21 0.02 60)',
      'surface-sunken':     'oklch(0.24 0.02 60)',
      'foreground':         'oklch(0.94 0.02 75)',
      'text-strong':        'oklch(0.97 0.02 75)',
      'text-subtle':        'oklch(0.6 0.02 70)',
      'muted':              'oklch(0.26 0.02 60)',
      'muted-foreground':   'oklch(0.72 0.02 70)',
      'border':             'oklch(0.32 0.025 60)',
      'border-strong':      'oklch(0.42 0.03 60)',
      'primary':            'oklch(0.88 0.04 75)',
      'primary-foreground': 'oklch(0.22 0.03 60)',
      'accent':             'oklch(0.28 0.03 65)',
      'accent-foreground':  'oklch(0.92 0.025 75)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Sage green on cream — organic and calm.',
    light: {
      'background':         'oklch(0.98 0.008 140)',
      'surface-muted':      'oklch(0.96 0.012 140)',
      'surface-sunken':     'oklch(0.93 0.018 140)',
      'foreground':         'oklch(0.22 0.025 150)',
      'text-strong':        'oklch(0.20 0.03 145)',
      'text-subtle':        'oklch(0.58 0.025 140)',
      'muted':              'oklch(0.94 0.015 140)',
      'muted-foreground':   'oklch(0.48 0.025 145)',
      'border':             'oklch(0.86 0.025 140)',
      'border-strong':      'oklch(0.76 0.03 140)',
      'primary':            'oklch(0.32 0.06 145)',
      'primary-foreground': 'oklch(0.97 0.012 140)',
      'accent':             'oklch(0.92 0.035 140)',
      'accent-foreground':  'oklch(0.22 0.04 145)',
    },
    dark: {
      'background':         'oklch(0.17 0.02 150)',
      'surface-muted':      'oklch(0.20 0.022 150)',
      'surface-sunken':     'oklch(0.23 0.025 150)',
      'foreground':         'oklch(0.93 0.025 140)',
      'text-strong':        'oklch(0.96 0.02 140)',
      'text-subtle':        'oklch(0.6 0.025 145)',
      'muted':              'oklch(0.26 0.025 150)',
      'muted-foreground':   'oklch(0.72 0.025 140)',
      'border':             'oklch(0.32 0.03 150)',
      'border-strong':      'oklch(0.43 0.035 145)',
      'primary':            'oklch(0.82 0.08 140)',
      'primary-foreground': 'oklch(0.20 0.04 150)',
      'accent':             'oklch(0.27 0.04 145)',
      'accent-foreground':  'oklch(0.92 0.03 140)',
    },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Deep blue with cream highlights — refined.',
    light: {
      'background':         'oklch(0.985 0.005 260)',
      'surface-muted':      'oklch(0.97 0.008 260)',
      'surface-sunken':     'oklch(0.945 0.012 260)',
      'foreground':         'oklch(0.22 0.04 270)',
      'text-strong':        'oklch(0.20 0.05 270)',
      'text-subtle':        'oklch(0.58 0.04 260)',
      'muted':              'oklch(0.95 0.012 260)',
      'muted-foreground':   'oklch(0.5 0.04 265)',
      'border':             'oklch(0.88 0.018 260)',
      'border-strong':      'oklch(0.78 0.025 260)',
      'primary':            'oklch(0.36 0.14 268)',
      'primary-foreground': 'oklch(0.97 0.01 260)',
      'accent':             'oklch(0.92 0.03 260)',
      'accent-foreground':  'oklch(0.22 0.07 270)',
    },
    dark: {
      'background':         'oklch(0.16 0.03 265)',
      'surface-muted':      'oklch(0.20 0.035 265)',
      'surface-sunken':     'oklch(0.23 0.04 265)',
      'foreground':         'oklch(0.94 0.02 260)',
      'text-strong':        'oklch(0.97 0.018 260)',
      'text-subtle':        'oklch(0.62 0.025 260)',
      'muted':              'oklch(0.26 0.04 265)',
      'muted-foreground':   'oklch(0.72 0.025 260)',
      'border':             'oklch(0.32 0.05 265)',
      'border-strong':      'oklch(0.42 0.06 265)',
      'primary':            'oklch(0.78 0.13 265)',
      'primary-foreground': 'oklch(0.18 0.04 265)',
      'accent':             'oklch(0.28 0.06 265)',
      'accent-foreground':  'oklch(0.92 0.03 260)',
    },
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    description: 'Ochre on warm sand — earthy and rich.',
    light: {
      'background':         'oklch(0.97 0.022 80)',
      'surface-muted':      'oklch(0.95 0.025 80)',
      'surface-sunken':     'oklch(0.92 0.03 75)',
      'foreground':         'oklch(0.24 0.04 50)',
      'text-strong':        'oklch(0.22 0.045 45)',
      'text-subtle':        'oklch(0.58 0.04 65)',
      'muted':              'oklch(0.93 0.03 75)',
      'muted-foreground':   'oklch(0.5 0.04 55)',
      'border':             'oklch(0.86 0.035 65)',
      'border-strong':      'oklch(0.75 0.045 60)',
      'primary':            'oklch(0.48 0.13 60)',
      'primary-foreground': 'oklch(0.97 0.02 80)',
      'accent':             'oklch(0.90 0.05 75)',
      'accent-foreground':  'oklch(0.24 0.05 50)',
    },
    dark: {
      'background':         'oklch(0.18 0.025 55)',
      'surface-muted':      'oklch(0.22 0.03 55)',
      'surface-sunken':     'oklch(0.25 0.035 55)',
      'foreground':         'oklch(0.93 0.025 75)',
      'text-strong':        'oklch(0.96 0.025 75)',
      'text-subtle':        'oklch(0.6 0.025 65)',
      'muted':              'oklch(0.28 0.035 55)',
      'muted-foreground':   'oklch(0.72 0.025 70)',
      'border':             'oklch(0.34 0.04 55)',
      'border-strong':      'oklch(0.45 0.05 55)',
      'primary':            'oklch(0.78 0.13 70)',
      'primary-foreground': 'oklch(0.22 0.04 55)',
      'accent':             'oklch(0.30 0.05 60)',
      'accent-foreground':  'oklch(0.93 0.03 75)',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool blue-grey — quiet and modern.',
    light: {
      'background':         'oklch(0.985 0 240)',
      'surface-muted':      'oklch(0.97 0.005 240)',
      'surface-sunken':     'oklch(0.94 0.008 240)',
      'foreground':         'oklch(0.22 0.015 245)',
      'text-strong':        'oklch(0.18 0.018 245)',
      'text-subtle':        'oklch(0.58 0.012 240)',
      'muted':              'oklch(0.95 0.008 240)',
      'muted-foreground':   'oklch(0.5 0.012 240)',
      'border':             'oklch(0.88 0.012 240)',
      'border-strong':      'oklch(0.78 0.015 240)',
      'primary':            'oklch(0.28 0.04 245)',
      'primary-foreground': 'oklch(0.97 0.005 240)',
      'accent':             'oklch(0.92 0.018 240)',
      'accent-foreground':  'oklch(0.22 0.025 245)',
    },
    dark: {
      'background':         'oklch(0.16 0.012 245)',
      'surface-muted':      'oklch(0.20 0.014 245)',
      'surface-sunken':     'oklch(0.23 0.016 245)',
      'foreground':         'oklch(0.95 0.005 240)',
      'text-strong':        'oklch(0.98 0.005 240)',
      'text-subtle':        'oklch(0.62 0.01 240)',
      'muted':              'oklch(0.26 0.016 245)',
      'muted-foreground':   'oklch(0.72 0.01 240)',
      'border':             'oklch(0.32 0.02 245)',
      'border-strong':      'oklch(0.42 0.025 245)',
      'primary':            'oklch(0.88 0.025 240)',
      'primary-foreground': 'oklch(0.20 0.025 245)',
      'accent':             'oklch(0.28 0.02 245)',
      'accent-foreground':  'oklch(0.92 0.015 240)',
    },
  },
  {
    id: 'plum',
    name: 'Plum',
    description: 'Deep aubergine with soft pink — bold but warm.',
    light: {
      'background':         'oklch(0.98 0.008 350)',
      'surface-muted':      'oklch(0.96 0.012 350)',
      'surface-sunken':     'oklch(0.93 0.018 345)',
      'foreground':         'oklch(0.23 0.04 340)',
      'text-strong':        'oklch(0.20 0.05 340)',
      'text-subtle':        'oklch(0.58 0.035 340)',
      'muted':              'oklch(0.95 0.015 350)',
      'muted-foreground':   'oklch(0.5 0.035 340)',
      'border':             'oklch(0.86 0.025 345)',
      'border-strong':      'oklch(0.76 0.035 340)',
      'primary':            'oklch(0.36 0.13 340)',
      'primary-foreground': 'oklch(0.97 0.012 350)',
      'accent':             'oklch(0.92 0.04 345)',
      'accent-foreground':  'oklch(0.23 0.06 340)',
    },
    dark: {
      'background':         'oklch(0.17 0.025 340)',
      'surface-muted':      'oklch(0.21 0.03 340)',
      'surface-sunken':     'oklch(0.24 0.035 340)',
      'foreground':         'oklch(0.94 0.02 345)',
      'text-strong':        'oklch(0.97 0.018 345)',
      'text-subtle':        'oklch(0.62 0.025 340)',
      'muted':              'oklch(0.27 0.035 340)',
      'muted-foreground':   'oklch(0.72 0.025 345)',
      'border':             'oklch(0.32 0.04 340)',
      'border-strong':      'oklch(0.43 0.05 340)',
      'primary':            'oklch(0.78 0.13 340)',
      'primary-foreground': 'oklch(0.20 0.04 340)',
      'accent':             'oklch(0.28 0.05 340)',
      'accent-foreground':  'oklch(0.92 0.03 345)',
    },
  },
]
