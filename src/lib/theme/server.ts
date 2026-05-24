import 'server-only'
import { cache } from 'react'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hasCapability } from '@/lib/auth/capabilities'
import { normalizeStored, type ThemeTokens } from './tokens'

export interface ThemeContext {
  /** The active tokens — preview if the viewer is the admin AND a preview exists, otherwise global. */
  tokens: ThemeTokens
  /** True when the active tokens above are the admin's local preview. */
  isPreview: boolean
  /** The published theme. Always populated (possibly with an empty object). */
  global: ThemeTokens
  /** The admin's draft, if one is currently set. `null` when no preview exists. */
  preview: ThemeTokens | null
}

function hasAnyOverride(t: ThemeTokens): boolean {
  if (!t) return false
  const hasLight = t.light && Object.keys(t.light).length > 0
  const hasDark  = t.dark  && Object.keys(t.dark).length  > 0
  const hasTypography = Object.keys(t).some((k) => k !== 'light' && k !== 'dark')
  return Boolean(hasLight || hasDark || hasTypography)
}

/**
 * Reads the active theme for the current request.
 *
 * Fast path (no preview set): one indexed select, no auth check.
 * Preview-set path: one select + one auth call to decide whether to serve
 * the preview (admin) or the published theme (everyone else). The auth
 * call makes the request dynamic, which is the intentional cost of having
 * a local preview active.
 *
 * Cached per-request via React's `cache()` so the layout's <style> + Google
 * Fonts <link> + any other consumer share a single fetch.
 */
export const getThemeContext = cache(async (): Promise<ThemeContext> => {
  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('theme_settings')
      .select('tokens, admin_preview_tokens')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return { tokens: {}, isPreview: false, global: {}, preview: null }

    const global = normalizeStored(data.tokens)
    const previewRaw = (data as { admin_preview_tokens?: unknown }).admin_preview_tokens
    const preview = previewRaw ? normalizeStored(previewRaw) : null

    if (!preview || !hasAnyOverride(preview)) {
      return { tokens: global, isPreview: false, global, preview: null }
    }

    // Preview exists — only serve it to viewers who can edit the theme.
    if (await hasCapability('theme.edit')) {
      return { tokens: preview, isPreview: true, global, preview }
    }
    return { tokens: global, isPreview: false, global, preview }
  } catch {
    return { tokens: {}, isPreview: false, global: {}, preview: null }
  }
})

/** Back-compat shim — return only the active tokens. */
export async function getThemeTokens(): Promise<ThemeTokens> {
  return (await getThemeContext()).tokens
}
