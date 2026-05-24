import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { sanitizeTokens } from '@/lib/theme/sanitize'

/**
 * GET  /api/theme/presets         — list all admin-saved presets
 * POST /api/theme/presets         — create a new preset { name, tokens }
 *
 * Both verbs require the theme.edit capability. Service-role client is used
 * for the actual queries since the table has RLS on with no policies.
 */

async function requireAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('theme.edit'))) return null
  return user
}

function missingTableResponse(error: { code?: string; message?: string }) {
  // PG missing-relation code; also caught when the table just isn't in the
  // schema cache yet. Give the admin the actual next step.
  if (error.code === '42P01' || /theme_presets/i.test(error.message ?? '')) {
    return NextResponse.json(
      {
        error:
          'theme_presets table not found — run the 017 migration in migrations-to-run.sql in your Supabase project, then try again.',
      },
      { status: 500 },
    )
  }
  return null
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('theme_presets')
    .select('id, name, tokens, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    const missing = missingTableResponse(error)
    if (missing) return missing
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ presets: data ?? [] })
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 60) return null
  return trimmed
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown
    tokens?: unknown
  }

  const name = cleanName(body.name)
  if (!name) {
    return NextResponse.json(
      { error: 'Name is required (1–60 characters).' },
      { status: 400 },
    )
  }
  if (!body.tokens || typeof body.tokens !== 'object') {
    return NextResponse.json({ error: 'Missing tokens object' }, { status: 400 })
  }

  const sanitized = sanitizeTokens(body.tokens)

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('theme_presets')
    .insert({ name, tokens: sanitized })
    .select('id, name, tokens, created_at, updated_at')
    .single()

  if (error) {
    const missing = missingTableResponse(error)
    if (missing) return missing
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ preset: data })
}
