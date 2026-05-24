import { getThemeContext } from '@/lib/theme/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import { THEME_DEFAULTS, type ThemeDefaultKey, type ThemeMode } from '@/theme.config'
import { normalizeStored, type ThemeTokens } from '@/lib/theme/tokens'
import CustomizeForm, { type SavedPreset } from '@/components/admin/customize-form'

export const dynamic = 'force-dynamic'

async function fetchSavedPresets(): Promise<SavedPreset[]> {
  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('theme_presets')
      .select('id, name, tokens, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      tokens: normalizeStored(row.tokens) as ThemeTokens,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))
  } catch {
    // Table might not exist yet — surface as empty list; the API routes
    // already return a clearer error if the admin actually tries to save.
    return []
  }
}

export default async function CustomizePage() {
  await guardPage('theme.edit')
  const [{ global, preview }, savedPresets] = await Promise.all([
    getThemeContext(),
    fetchSavedPresets(),
  ])

  const defaults: Record<ThemeMode, Record<ThemeDefaultKey, string>> = {
    light: THEME_DEFAULTS.light,
    dark:  THEME_DEFAULTS.dark,
  }

  // Seed the form with the preview if one exists — the admin's mid-edit
  // draft. Otherwise seed with the published theme.
  const initial = preview ?? global
  const hasLocalDraft = preview !== null

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customize</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the colors and fonts used everywhere on the site. Use the
          light/dark tabs to tune each mode, or pick a preset.
        </p>
      </div>

      <CustomizeForm
        initial={initial}
        defaults={defaults}
        savedPresets={savedPresets}
        hasLocalDraft={hasLocalDraft}
      />
    </div>
  )
}
