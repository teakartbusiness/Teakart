import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { sanitizeTokens } from '@/lib/theme/sanitize'

/**
 * PATCH  /api/theme/presets/[id]  — update name and/or tokens
 * DELETE /api/theme/presets/[id]  — remove a saved preset
 *
 * Admin-only.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('theme.edit'))) return null
  return user
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 60) return null
  return trimmed
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid preset id' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown
    tokens?: unknown
  }

  const patch: { name?: string; tokens?: ReturnType<typeof sanitizeTokens> } = {}

  if (body.name !== undefined) {
    const name = cleanName(body.name)
    if (!name) {
      return NextResponse.json(
        { error: 'Name must be 1–60 characters.' },
        { status: 400 },
      )
    }
    patch.name = name
  }

  if (body.tokens !== undefined) {
    if (!body.tokens || typeof body.tokens !== 'object') {
      return NextResponse.json({ error: 'tokens must be an object' }, { status: 400 })
    }
    patch.tokens = sanitizeTokens(body.tokens)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('theme_presets')
    .update(patch)
    .eq('id', id)
    .select('id, name, tokens, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json({ preset: data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid preset id' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('theme_presets').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
