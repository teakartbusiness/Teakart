import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hasCapability } from '@/lib/auth/capabilities'
import { isAllowedOrderTransition } from '@/lib/status-progression'
import { createNotification, orderStatusTitle } from '@/lib/notifications'
import type { OrderStatus } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const isAdmin = await hasCapability('orders.view')
  const reader = isAdmin ? getSupabaseAdminClient() : supabase

  const { data: order, error } = await reader
    .from('orders')
    .select(`
      *,
      address:addresses ( full_address, city, state, pincode ),
      order_status_history ( id, status, note, created_at )
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!isAdmin && order.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const history = (order.order_status_history as { created_at: string }[])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ ...order, order_status_history: history })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await hasCapability('orders.update_status'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const body = await request.json() as {
    status?: OrderStatus
    note?: string
    estimated_delivery_date?: string | null
  }

  const admin = getSupabaseAdminClient()

  // If status is changing, enforce strict +1 progression server-side. The
  // UI already filters the dropdown but a curl request could try to skip.
  if (body.status !== undefined) {
    const { data: current } = await admin
      .from('orders')
      .select('status')
      .eq('id', id)
      .maybeSingle()
    if (!current) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!isAllowedOrderTransition(current.status as OrderStatus, body.status)) {
      return NextResponse.json(
        { error: `Cannot move order from "${current.status}" to "${body.status}". Use the next step.` },
        { status: 400 },
      )
    }
  }

  const orderUpdates: Record<string, unknown> = {}
  if (body.status !== undefined) orderUpdates.status = body.status

  // Optional estimated delivery date (YYYY-MM-DD) — seller-set, clearable.
  if (body.estimated_delivery_date !== undefined) {
    const d = body.estimated_delivery_date
    if (d === null || d === '') {
      orderUpdates.estimated_delivery_date = null
    } else if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      orderUpdates.estimated_delivery_date = d
    } else {
      return NextResponse.json({ error: 'Invalid delivery date' }, { status: 400 })
    }
  }

  if (Object.keys(orderUpdates).length > 0) {
    const { error } = await admin
      .from('orders')
      .update(orderUpdates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (body.status !== undefined) {
    const { error } = await admin
      .from('order_status_history')
      .insert({ order_id: id, status: body.status, note: body.note ?? null })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: updated, error: fetchError } = await admin
    .from('orders')
    .select(`
      *,
      address:addresses ( full_address, city, state, pincode ),
      order_status_history ( id, status, note, created_at )
    `)
    .eq('id', id)
    .single()

  if (fetchError || !updated) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Notify the customer in-app of the new status (best-effort; never blocks).
  if (body.status !== undefined && updated.user_id) {
    await createNotification(admin, {
      userId: updated.user_id as string,
      type: 'order_status',
      title: orderStatusTitle(body.status),
      body: `Order #${id.slice(0, 8)} is now ${body.status}.`,
      href: `/account/orders/${id}`,
    })
  }

  const history = (updated.order_status_history as { created_at: string }[])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ ...updated, order_status_history: history })
}
