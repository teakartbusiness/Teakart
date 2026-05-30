import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET  /api/notifications — the signed-in customer's recent notifications +
 *   unread count. Signed-out callers get an empty feed (200) so the header bell
 *   can render without erroring.
 * PATCH /api/notifications — mark read. Body: { id } (one) or { all: true }.
 * DELETE /api/notifications — remove. Body: { id } (one) or { readOnly: true }
 *   (every already-read notification).
 *
 * Writes go through the service-role client scoped to the session user, so a
 * customer can only ever touch their own rows.
 */
export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [], unread: 0 })

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const notifications = data ?? []
  const unread = notifications.filter((n) => n.read_at === null).length
  return NextResponse.json({ notifications, unread })
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean }
  const admin = getSupabaseAdminClient()
  const now = new Date().toISOString()

  if (body.all === true) {
    const { error } = await admin
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (typeof body.id === 'string' && UUID_RE.test(body.id)) {
    // Scope to the session user so one customer can't mark another's read.
    const { error } = await admin
      .from('notifications')
      .update({ read_at: now })
      .eq('id', body.id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide an id or all:true' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { id?: string; readOnly?: boolean }
  const admin = getSupabaseAdminClient()

  // Clear all ALREADY-READ notifications (keeps unread ones in place).
  if (body.readOnly === true) {
    const { error } = await admin
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .not('read_at', 'is', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (typeof body.id === 'string' && UUID_RE.test(body.id)) {
    // Scope to the session user so one customer can't delete another's row.
    const { error } = await admin
      .from('notifications')
      .delete()
      .eq('id', body.id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide an id or readOnly:true' }, { status: 400 })
}
