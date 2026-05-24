import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { recordSales } from '@/lib/inventory'
import type { CartLine, Variant } from '@/types'

/**
 * Mock payment endpoint — creates an order directly, bypassing Razorpay.
 * Strictly gated on NEXT_PUBLIC_PAYMENT_MODE === 'mock'. Returns 404 in any
 * other configuration so it doesn't exist for callers in production.
 *
 * Accepts the same shapes as /api/checkout (single product or cart).
 */
const MAX_CART_ITEMS = 20

type IncomingLine = { productId?: string; variantLabel?: string | null; quantity?: number }

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_PAYMENT_MODE !== 'mock') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    productId?: string
    selectedSize?: string
    quantity?: number
    addressId?: string
    lines?: IncomingLine[]
    source?: 'cart' | 'buynow'
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { addressId, source } = body
  if (!addressId) {
    return NextResponse.json({ error: 'Missing addressId' }, { status: 400 })
  }

  const { data: address } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!address) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  let rawLines: IncomingLine[]
  if (Array.isArray(body.lines) && body.lines.length > 0) {
    // Explicit lines (checkout-page quantity edits) win; prices re-derived below.
    rawLines = body.lines
  } else if (source === 'cart') {
    const { data: userRow } = await supabase
      .from('users')
      .select('cart')
      .eq('id', user.id)
      .single()
    const stored = ((userRow?.cart ?? []) as CartLine[]).filter(
      (l) => l && typeof l.product_id === 'string' && typeof l.quantity === 'number' && l.quantity > 0,
    )
    if (stored.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
    }
    rawLines = stored.map((l) => ({
      productId: l.product_id,
      variantLabel: l.variant_label,
      quantity: l.quantity,
    }))
  } else if (body.productId) {
    const q = typeof body.quantity === 'number' && body.quantity > 0 ? Math.floor(body.quantity) : 1
    rawLines = [{
      productId: body.productId,
      variantLabel: body.selectedSize ?? null,
      quantity: q,
    }]
  } else {
    return NextResponse.json({ error: 'No items in checkout request' }, { status: 400 })
  }

  if (rawLines.length > MAX_CART_ITEMS) {
    return NextResponse.json(
      { error: `Cart has too many items (max ${MAX_CART_ITEMS}).` },
      { status: 400 },
    )
  }

  const productIds = Array.from(new Set(
    rawLines.map((l) => l.productId).filter((id): id is string => typeof id === 'string'),
  ))
  const { data: productRows } = await supabase
    .from('products')
    .select('id, price, variants, in_stock, is_deleted')
    .in('id', productIds)
  const productById = new Map(
    (productRows ?? []).filter((p) => !p.is_deleted).map((p) => [p.id as string, p]),
  )

  const resolved: { productId: string; variantLabel: string | null; quantity: number; unitPrice: number }[] = []
  for (const line of rawLines) {
    if (!line.productId) continue
    const product = productById.get(line.productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found or no longer available' }, { status: 404 })
    }
    if (product.in_stock === false) {
      return NextResponse.json({ error: 'A product is out of stock' }, { status: 400 })
    }
    const variants = (product.variants ?? []) as Variant[]
    const requestedVariant = line.variantLabel && line.variantLabel !== 'default' && line.variantLabel !== ''
      ? line.variantLabel : null
    let unitPrice: number
    let variantLabel: string | null = null
    if (variants.length > 0) {
      if (!requestedVariant) {
        return NextResponse.json({ error: 'Variant required' }, { status: 400 })
      }
      const v = variants.find((vv) => vv.label === requestedVariant)
      if (!v) {
        return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
      }
      unitPrice = v.price
      variantLabel = v.label
    } else {
      unitPrice = product.price
    }
    const qty = typeof line.quantity === 'number' && line.quantity > 0 ? Math.floor(line.quantity) : 1
    resolved.push({ productId: line.productId, variantLabel, quantity: qty, unitPrice })
  }

  const totalRupees = resolved.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0)
  if (totalRupees <= 0) {
    return NextResponse.json({ error: 'Total must be greater than zero' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  const mockOrderId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const { data: inserted, error: insertErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      address_id: addressId,
      amount_paid: totalRupees,
      status: 'pending',
      payment_status: 'paid',
      razorpay_order_id: mockOrderId,
      razorpay_payment_id: `${mockOrderId}_payment`,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message ?? 'Failed to create order' },
      { status: 500 }
    )
  }

  const { error: itemsErr } = await admin.from('order_items').insert(
    resolved.map((l) => ({
      order_id: inserted.id,
      product_id: l.productId,
      variant_label: l.variantLabel,
      unit_price: l.unitPrice,
      quantity: l.quantity,
    })),
  )

  if (itemsErr) {
    console.error('[api/checkout/mock] order_items insert failed', itemsErr)
  }

  // Bump per-product sales counters (best-seller badges + best-selling sort).
  await recordSales(admin, resolved)

  // Clear cart if this was a cart checkout.
  if (source === 'cart') {
    await admin.from('users').update({ cart: [] }).eq('id', user.id)
  }

  await admin.from('order_status_history').insert({
    order_id: inserted.id,
    status: 'pending',
    note: 'Mock order (test mode)',
  })

  return NextResponse.json({ orderId: inserted.id })
}
