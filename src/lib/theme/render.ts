import {
  COLOR_TOKEN_SET,
  TYPOGRAPHY_TOKEN_SET,
  diffFromDefaults,
  getFontChoice,
  type ColorTokenKey,
  type ThemeTokens,
} from './tokens'
import type { ThemeDefaultKey } from '@/theme.config'

const FONT_TOKEN_NAMES = new Set<ThemeDefaultKey>(['font-sans', 'font-display', 'font-mono'])

/**
 * Defense-in-depth: even though /api/theme PATCH already strips dangerous
 * characters, a token value coming straight from the DB could be tampered
 * with via the Supabase studio. Re-validate at render time so we can never
 * emit something that breaks out of <style> or fetches a remote resource.
 */
const UNSAFE_CSS_VALUE = /[<>{};]|url\s*\(|@import|expression\s*\(|\\/i

function sanitizeCssValue(value: string): string | null {
  if (UNSAFE_CSS_VALUE.test(value)) return null
  if (value.length > 200) return null
  return value
}

function formatRule(name: string, value: string): string | null {
  if (FONT_TOKEN_NAMES.has(name as ThemeDefaultKey)) {
    const stack = getFontChoice(value)?.stack
    if (!stack) return null
    const safe = sanitizeCssValue(stack)
    if (!safe) return null
    return `  --${name}: ${safe};`
  }
  const safe = sanitizeCssValue(value)
  if (!safe) return null
  return `  --${name}: ${safe};`
}

/**
 * Build the inline <style> body that overrides defaults for BOTH modes.
 * Light overrides go into `:root`, dark overrides into `.dark`, shared
 * typography overrides into both so a font change applies in either mode.
 */
export function buildThemeStyleBody(saved: ThemeTokens | null | undefined): string {
  if (!saved) return ''
  const diff = diffFromDefaults(saved)

  const lightRules: string[] = []
  const darkRules: string[] = []

  // Light-mode color overrides.
  if (diff.light) {
    for (const [name, value] of Object.entries(diff.light)) {
      if (!value) continue
      const rule = formatRule(name, value)
      if (rule) lightRules.push(rule)
    }
  }

  // Dark-mode color overrides.
  if (diff.dark) {
    for (const [name, value] of Object.entries(diff.dark)) {
      if (!value) continue
      const rule = formatRule(name, value)
      if (rule) darkRules.push(rule)
    }
  }

  // Shared typography overrides go into both blocks so the choice applies
  // in either mode.
  for (const [name, value] of Object.entries(diff)) {
    if (name === 'light' || name === 'dark') continue
    if (typeof value !== 'string') continue
    const rule = formatRule(name, value)
    if (rule) {
      lightRules.push(rule)
      darkRules.push(rule)
    }
  }

  const blocks: string[] = []
  if (lightRules.length > 0) blocks.push(`:root {\n${lightRules.join('\n')}\n}`)
  if (darkRules.length > 0)  blocks.push(`.dark {\n${darkRules.join('\n')}\n}`)
  return blocks.join('\n')
}

/** Build a Google Fonts href for the saved typography overrides. */
export function buildGoogleFontsHref(saved: ThemeTokens | null | undefined): string | null {
  const families = new Set<string>()
  for (const name of FONT_TOKEN_NAMES) {
    const value = (saved as Record<string, string | undefined> | null | undefined)?.[name]
    if (!value) continue
    const choice = getFontChoice(value)
    if (!choice) continue
    // Don't load Geist via Google Fonts — it's already provided by next/font.
    if (choice.value === 'Geist' || choice.value === 'Geist Mono') continue
    families.add(choice.value)
  }
  if (families.size === 0) return null

  const params = Array.from(families)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

// Re-export so consumers can keep importing from this module if they prefer.
export { COLOR_TOKEN_SET, TYPOGRAPHY_TOKEN_SET, type ColorTokenKey }
