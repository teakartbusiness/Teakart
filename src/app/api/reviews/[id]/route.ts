import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * PATCH /api/reviews/[id] — admin moderation. Soft-hide / unhide.
 *
 * Body: { is_hidden: boolean }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('reviews.moderate'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { is_hidden?: unknown }
  if (typeof body.is_hidden !== 'boolean') {
    return NextResponse.json({ error: 'is_hidden must be a boolean' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('product_reviews')
    .update({ is_hidden: body.is_hidden })
    .eq('id', id)
    .select('id, is_hidden')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ review: data })
}
