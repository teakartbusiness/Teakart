import {
  COLOR_TOKEN_NAMES,
  TYPOGRAPHY_TOKEN_NAMES,
  THEME_DEFAULTS,
  type ColorTokenKey,
  type ThemeDefaultKey,
  type ThemeMode,
  type TypographyTokenKey,
} from '@/theme.config'

/**
 * Spec for the customization UI. Default VALUES live in
 * `src/theme.config.ts` — edit them there. This file describes how each
 * token is grouped, labelled, and edited on /admin/customize.
 */

export type TokenKind = 'color' | 'font' | 'size'

export interface TokenSpec {
  name: ThemeDefaultKey
  label: string
  kind: TokenKind
  group: string
  /** True for tokens that have separate light/dark defaults — false for fonts and sizes which are shared. */
  perMode: boolean
  help?: string
}

const COLOR_SPECS: TokenSpec[] = [
  // Brand
  { name: 'primary',                  label: 'Primary',             kind: 'color', group: 'Brand',     perMode: true, help: 'Main action color (buttons, links).' },
  { name: 'primary-foreground',       label: 'Primary text',        kind: 'color', group: 'Brand',     perMode: true, help: 'Text drawn on top of the primary color.' },
  { name: 'accent',                   label: 'Accent',              kind: 'color', group: 'Brand',     perMode: true },
  { name: 'accent-foreground',        label: 'Accent text',         kind: 'color', group: 'Brand',     perMode: true },
  { name: 'logo-color',               label: 'Logo color',          kind: 'color', group: 'Brand',     perMode: true, help: 'Fill color of the TeaKart wordmark in the header / footer.' },

  // Surface
  { name: 'background',               label: 'Page background',     kind: 'color', group: 'Surface',   perMode: true },
  { name: 'foreground',               label: 'Body text',           kind: 'color', group: 'Surface',   perMode: true },
  { name: 'surface-muted',            label: 'Muted surface',       kind: 'color', group: 'Surface',   perMode: true },
  { name: 'surface-sunken',           label: 'Sunken surface',      kind: 'color', group: 'Surface',   perMode: true },
  { name: 'text-strong',              label: 'Headings',            kind: 'color', group: 'Surface',   perMode: true },
  { name: 'text-subtle',              label: 'Subtle text',         kind: 'color', group: 'Surface',   perMode: true },
  { name: 'muted',                    label: 'Muted',               kind: 'color', group: 'Surface',   perMode: true },
  { name: 'muted-foreground',         label: 'Muted text',          kind: 'color', group: 'Surface',   perMode: true },
  { name: 'border',                   label: 'Border',              kind: 'color', group: 'Surface',   perMode: true },
  { name: 'border-strong',            label: 'Border strong',       kind: 'color', group: 'Surface',   perMode: true },

  // Semantic
  { name: 'destructive',              label: 'Destructive',         kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'destructive-foreground',   label: 'Destructive text',    kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'destructive-soft',         label: 'Destructive soft bg', kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'success',                  label: 'Success',             kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'success-foreground',       label: 'Success text',        kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'success-soft',             label: 'Success soft bg',     kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'warning',                  label: 'Warning',             kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'warning-foreground',       label: 'Warning text',        kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'warning-soft',             label: 'Warning soft bg',     kind: 'color', group: 'Semantic',  perMode: true },
  { name: 'warning-ring',             label: 'Warning border',      kind: 'color', group: 'Semantic',  perMode: true },

  // Order statuses
  { name: 'status-pending-bg',        label: 'Pending bg',          kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-pending-fg',        label: 'Pending text',        kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-pending-ring',      label: 'Pending border',      kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-confirmed-bg',      label: 'Confirmed bg',        kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-confirmed-fg',      label: 'Confirmed text',      kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-confirmed-ring',    label: 'Confirmed border',    kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-shipped-bg',        label: 'Shipped bg',          kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-shipped-fg',        label: 'Shipped text',        kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-shipped-ring',      label: 'Shipped border',      kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-delivered-bg',      label: 'Delivered bg',        kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-delivered-fg',      label: 'Delivered text',      kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-delivered-ring',    label: 'Delivered border',    kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-cancelled-bg',      label: 'Cancelled bg',        kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-cancelled-fg',      label: 'Cancelled text',      kind: 'color', group: 'Order status', perMode: true },
  { name: 'status-cancelled-ring',    label: 'Cancelled border',    kind: 'color', group: 'Order status', perMode: true },
]

const FONT_SPECS: TokenSpec[] = [
  { name: 'font-sans',    label: 'Body font',      kind: 'font', group: 'Typography', perMode: false, help: 'Used for almost all on-screen text.' },
  { name: 'font-display', label: 'Heading font',   kind: 'font', group: 'Typography', perMode: false, help: 'Used for page titles and product names.' },
  { name: 'font-mono',    label: 'Monospace font', kind: 'font', group: 'Typography', perMode: false, help: 'Used for IDs and code-like text.' },
]

const SIZE_SPECS: TokenSpec[] = [
  { name: 'base-font-size', label: 'Base text size', kind: 'size', group: 'Typography', perMode: false, help: 'Bigger values scale up text throughout the site.' },
]

export const THEME_TOKENS: TokenSpec[] = [...COLOR_SPECS, ...FONT_SPECS, ...SIZE_SPECS]

export const TOKEN_NAMES = new Set<string>(THEME_TOKENS.map((t) => t.name))
export const COLOR_TOKEN_SET = new Set<string>(COLOR_TOKEN_NAMES)
export const TYPOGRAPHY_TOKEN_SET = new Set<string>(TYPOGRAPHY_TOKEN_NAMES)

/**
 * Curated list of Google Fonts the admin can pick from. The layout loads
 * whichever is selected via a <link rel="stylesheet"> tag. Stick to fonts
 * with good Latin coverage and a balance of weight options.
 */
export const FONT_CHOICES: Array<{ value: string; label: string; stack: string }> = [
  // Sans
  { value: 'Geist',                label: 'Geist (default)',         stack: '"Geist", ui-sans-serif, system-ui, sans-serif' },
  { value: 'Inter',                label: 'Inter',                   stack: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { value: 'Manrope',              label: 'Manrope',                 stack: '"Manrope", ui-sans-serif, system-ui, sans-serif' },
  { value: 'DM Sans',              label: 'DM Sans',                 stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif' },
  { value: 'Plus Jakarta Sans',    label: 'Plus Jakarta Sans',       stack: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' },
  { value: 'Space Grotesk',        label: 'Space Grotesk',           stack: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
  { value: 'Outfit',               label: 'Outfit',                  stack: '"Outfit", ui-sans-serif, system-ui, sans-serif' },
  // Serif / display
  { value: 'Playfair Display',     label: 'Playfair Display (serif)',stack: '"Playfair Display", ui-serif, Georgia, serif' },
  { value: 'Cormorant Garamond',   label: 'Cormorant Garamond',      stack: '"Cormorant Garamond", ui-serif, Georgia, serif' },
  { value: 'Fraunces',             label: 'Fraunces',                stack: '"Fraunces", ui-serif, Georgia, serif' },
  { value: 'Lora',                 label: 'Lora',                    stack: '"Lora", ui-serif, Georgia, serif' },
  { value: 'EB Garamond',          label: 'EB Garamond',             stack: '"EB Garamond", ui-serif, Georgia, serif' },
  // Mono
  { value: 'Geist Mono',           label: 'Geist Mono (default)',    stack: '"Geist Mono", ui-monospace, SFMono-Regular, monospace' },
  { value: 'JetBrains Mono',       label: 'JetBrains Mono',          stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
  { value: 'IBM Plex Mono',        label: 'IBM Plex Mono',           stack: '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace' },
]

export function getFontChoice(value: string) {
  return FONT_CHOICES.find((f) => f.value === value)
}

/* ============================================================
 * Saved tokens shape.
 *
 *   ThemeTokens = {
 *     light?: { [colorToken]: cssValue }
 *     dark?:  { [colorToken]: cssValue }
 *     // Typography lives at the top level — shared across modes.
 *     [typographyToken]?: cssValue
 *   }
 *
 * The API and render layers handle backwards-compat with the old flat
 * format (treated as light-mode color overrides + shared typography).
 * ============================================================ */

export type ColorOverrides = Partial<Record<ColorTokenKey, string>>
export type TypographyOverrides = Partial<Record<TypographyTokenKey, string>>

export interface ThemeTokens extends TypographyOverrides {
  light?: ColorOverrides
  dark?: ColorOverrides
}

/** Normalize legacy flat saved data to the new shape. */
export function normalizeStored(raw: unknown): ThemeTokens {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>

  const hasModeBucket =
    (obj.light && typeof obj.light === 'object') ||
    (obj.dark && typeof obj.dark === 'object')

  if (hasModeBucket) {
    const out: ThemeTokens = {}
    if (obj.light && typeof obj.light === 'object') {
      out.light = filterColorObject(obj.light as Record<string, unknown>)
    }
    if (obj.dark && typeof obj.dark === 'object') {
      out.dark = filterColorObject(obj.dark as Record<string, unknown>)
    }
    for (const key of TYPOGRAPHY_TOKEN_NAMES) {
      const v = obj[key]
      if (typeof v === 'string') (out as Record<string, string>)[key] = v
    }
    return out
  }

  // Legacy flat structure: split tokens by kind.
  const out: ThemeTokens = {}
  const lightColors: ColorOverrides = {}
  for (const [name, val] of Object.entries(obj)) {
    if (typeof val !== 'string') continue
    if (COLOR_TOKEN_SET.has(name)) {
      lightColors[name as ColorTokenKey] = val
    } else if (TYPOGRAPHY_TOKEN_SET.has(name)) {
      (out as Record<string, string>)[name] = val
    }
  }
  if (Object.keys(lightColors).length > 0) out.light = lightColors
  return out
}

function filterColorObject(obj: Record<string, unknown>): ColorOverrides {
  const out: ColorOverrides = {}
  for (const [name, val] of Object.entries(obj)) {
    if (COLOR_TOKEN_SET.has(name) && typeof val === 'string') {
      out[name as ColorTokenKey] = val
    }
  }
  return out
}

/** Default-value lookup for a given mode (colors + shared typography). */
export function defaultsForMode(mode: ThemeMode): Record<ThemeDefaultKey, string> {
  return THEME_DEFAULTS[mode]
}

/** Merge defaults + saved overrides → resolved values for the given mode. */
export function resolveForMode(saved: ThemeTokens, mode: ThemeMode): Record<ThemeDefaultKey, string> {
  const out = { ...defaultsForMode(mode) }
  const colors = saved[mode]
  if (colors) {
    for (const [name, val] of Object.entries(colors)) {
      if (val) out[name as ThemeDefaultKey] = val
    }
  }
  for (const key of TYPOGRAPHY_TOKEN_NAMES) {
    const v = (saved as Record<string, string | undefined>)[key]
    if (v) out[key] = v
  }
  return out
}

/**
 * Diff against defaults — returns only the tokens that differ. Used to keep
 * the stored JSONB small.
 */
export function diffFromDefaults(saved: ThemeTokens): ThemeTokens {
  const out: ThemeTokens = {}
  const lightDiff: ColorOverrides = {}
  const darkDiff: ColorOverrides = {}
  for (const name of COLOR_TOKEN_NAMES) {
    const lv = saved.light?.[name]
    if (lv && lv !== THEME_DEFAULTS.light[name]) lightDiff[name] = lv
    const dv = saved.dark?.[name]
    if (dv && dv !== THEME_DEFAULTS.dark[name]) darkDiff[name] = dv
  }
  if (Object.keys(lightDiff).length > 0) out.light = lightDiff
  if (Object.keys(darkDiff).length > 0) out.dark = darkDiff
  for (const key of TYPOGRAPHY_TOKEN_NAMES) {
    const v = (saved as Record<string, string | undefined>)[key]
    if (v && v !== THEME_DEFAULTS.light[key]) {
      (out as Record<string, string>)[key] = v
    }
  }
  return out
}

export type { ThemeMode, ColorTokenKey, TypographyTokenKey, ThemeDefaultKey }
