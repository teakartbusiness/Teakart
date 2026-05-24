import {
  COLOR_TOKEN_SET,
  TYPOGRAPHY_TOKEN_SET,
  normalizeStored,
  type ColorOverrides,
  type ThemeTokens,
} from './tokens'
import type { ColorTokenKey, ThemeMode, TypographyTokenKey } from '@/theme.config'

// Block characters that could open new CSS rules or hijack the parser.
const UNSAFE_CSS = /[<>{};]/
const UNSAFE_RESOURCE = /url\s*\(|@import|expression\s*\(|\\/i

/** Returns the cleaned value or null if rejected. */
export function cleanValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const v = raw.trim()
  if (v.length === 0 || v.length > 200) return null
  if (UNSAFE_CSS.test(v) || UNSAFE_RESOURCE.test(v)) return null
  return v
}

function sanitizeColorBucket(input: unknown): ColorOverrides {
  if (!input || typeof input !== 'object') return {}
  const out: ColorOverrides = {}
  for (const [name, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!COLOR_TOKEN_SET.has(name)) continue
    const v = cleanValue(raw)
    if (v) out[name as ColorTokenKey] = v
  }
  return out
}

/**
 * Accept either the new `{ light, dark, ...typography }` shape or the legacy
 * flat shape (normalized first), then strip unknown keys + reject unsafe
 * values. Returns a `ThemeTokens` safe to store in JSONB and re-emit as CSS.
 */
export function sanitizeTokens(raw: unknown): ThemeTokens {
  const normalized = normalizeStored(raw)
  const out: ThemeTokens = {}

  for (const mode of ['light', 'dark'] as ThemeMode[]) {
    const bucket = normalized[mode]
    if (!bucket) continue
    const clean = sanitizeColorBucket(bucket)
    if (Object.keys(clean).length > 0) out[mode] = clean
  }

  for (const [name, raw2] of Object.entries(normalized)) {
    if (name === 'light' || name === 'dark') continue
    if (!TYPOGRAPHY_TOKEN_SET.has(name)) continue
    const v = cleanValue(raw2)
    if (v) (out as Record<string, string>)[name as TypographyTokenKey] = v
  }

  return out
}
