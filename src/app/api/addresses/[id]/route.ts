import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * "Edit" an address. Addresses are immutable by design — this verifies the
 * caller owns the original, creates a new row with the updated values, then
 * soft-deletes the old one. Older orders referencing the old address keep
 * working because the row still exists (just flagged is_deleted).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = (await request.json()) as {
    full_address?: string
    city?: string
    state?: string
    pincode?: string
  }

  const full_address = body.full_address?.trim()
  const city = body.city?.trim()
  const state = body.state?.trim()
  const pincode = body.pincode?.trim()

  if (!full_address || !city || !state || !pincode) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  // Confirm the caller owns the address being edited (anon RLS scopes to own rows).
  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  const admin = getSupabaseAdminClient()

  // Insert the replacement first — if the insert fails, the old row is unchanged.
  const { data: created, error: insertErr } = await admin
    .from('addresses')
    .insert({
      user_id: user.id,
      full_address,
      city,
      state,
      pincode,
    })
    .select()
    .single()

  if (insertErr || !created) {
    return NextResponse.json(
      { error: insertErr?.message ?? 'Failed to save address' },
      { status: 500 }
    )
  }

  // Soft-delete the old row. If this fails, we log but don't roll back the
  // new row — the user would just see both addresses, which is recoverable.
  const { error: deleteErr } = await admin
    .from('addresses')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteErr) {
    console.error('[api/addresses/[id] PATCH] failed to soft-delete old row', deleteErr)
  }

  return NextResponse.json(created)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership via the user-session client (RLS scopes to own rows).
  const { data: address } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (!address) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Soft-delete needs service role — addresses table has no UPDATE RLS policy.
  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('addresses')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
