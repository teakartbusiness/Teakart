import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { normalizeStored } from '@/lib/theme/tokens'
import { sanitizeTokens } from '@/lib/theme/sanitize'

export async function GET() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('theme_settings')
    .select('tokens')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Short CDN cache so casual consumers (none today; we read server-side
  // via lib/theme/server.ts on the layout) don't hammer origin. The 60s
  // stale window is short enough that admin saves are reflected quickly.
  return NextResponse.json(
    { tokens: normalizeStored(data?.tokens) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
      },
    },
  )
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('theme.edit'))) return null
  return user
}

function missingTableResponse(error: { code?: string; message?: string }) {
  if (error.code === '42P01' || /theme_settings/i.test(error.message ?? '')) {
    return NextResponse.json(
      {
        error:
          'theme_settings table not found — run the 012 migration in schema.sql in your Supabase project, then save again.',
      },
      { status: 500 },
    )
  }
  return null
}

/**
 * PATCH /api/theme
 *
 * Body: { tokens, scope?: 'global' | 'local' }
 *
 * scope='global' (default) — write to `theme_settings.tokens` (the published
 *   theme) AND clear `admin_preview_tokens` so the admin's draft doesn't keep
 *   overriding their own view after publishing.
 *
 * scope='local' — write to `admin_preview_tokens` only. Visitors continue to
 *   see the published theme; only the signed-in admin sees the preview.
 *
 * Local writes that result in an empty token set are stored as null so the
 * server-side reader can skip the auth check on subsequent requests.
 */
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    tokens?: unknown
    scope?: unknown
  }

  if (!body.tokens || typeof body.tokens !== 'object') {
    return NextResponse.json({ error: 'Missing tokens object' }, { status: 400 })
  }

  const scope = body.scope === 'local' ? 'local' : 'global'
  const sanitized = sanitizeTokens(body.tokens)

  const admin = getSupabaseAdminClient()

  const update =
    scope === 'global'
      ? { tokens: sanitized, admin_preview_tokens: null }
      : { admin_preview_tokens: sanitized }

  const { error } = await admin
    .from('theme_settings')
    .update(update)
    .eq('id', 1)

  if (error) {
    const missing = missingTableResponse(error)
    if (missing) return missing
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tokens: sanitized, scope })
}

/**
 * DELETE /api/theme — discard the admin's local preview. Restores the
 * published theme for the admin's own view. No effect on visitors.
 */
export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('theme_settings')
    .update({ admin_preview_tokens: null })
    .eq('id', 1)

  if (error) {
    const missing = missingTableResponse(error)
    if (missing) return missing
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
