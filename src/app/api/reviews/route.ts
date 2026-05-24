import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/reviews — customer submits OR updates their review for a product
 * they bought (verified via an order_item they own).
 *
 * Eligibility (re-checked even on edit, since a refund/return could revoke it):
 *   - The order belongs to the user.
 *   - The order's status is 'delivered'.
 *
 * Uniqueness: ONE review per (user_id, product_id) — enforced by DB
 * constraint. This endpoint upserts on that pair, so calling it twice for
 * the same product just updates the previous review's rating/body. Even if
 * the customer cites a different order_item_id (because they bought the
 * product twice), the same review row gets updated.
 *
 * Body: { orderItemId, rating (1-5), body? }
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { orderItemId?: string; rating?: number; body?: string; imageUrls?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orderItemId = typeof body.orderItemId === 'string' ? body.orderItemId : ''
  const rating = typeof body.rating === 'number' ? Math.round(body.rating) : 0
  if (!orderItemId || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'orderItemId and rating (1-5) required' }, { status: 400 })
  }
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 4000) : null

  // Image cap is admin-configurable via review_settings (default 1, range 0–10).
  // Cloudinary URLs only — reject anything that doesn't look like one of
  // our uploads.
  const admin = getSupabaseAdminClient()
  const { data: settings } = await admin
    .from('review_settings')
    .select('max_images_per_review')
    .eq('id', 1)
    .maybeSingle()
  const maxImages = typeof settings?.max_images_per_review === 'number'
    ? Math.max(0, Math.min(10, settings.max_images_per_review))
    : 1

  const rawUrls = Array.isArray(body.imageUrls) ? body.imageUrls : []
  const imageUrls = rawUrls
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => /^https:\/\/res\.cloudinary\.com\//.test(u))
    .slice(0, maxImages)

  // Verify eligibility — item belongs to a delivered order owned by user.
  const { data: item } = await supabase
    .from('order_items')
    .select('id, product_id, order:orders(user_id, status)')
    .eq('id', orderItemId)
    .maybeSingle()

  const order = (item?.order ?? null) as { user_id: string; status: string } | null
  if (!item || !order) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Not your order' }, { status: 403 })
  }
  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'You can only review items from delivered orders.' }, { status: 400 })
  }

  // Upsert by (user_id, product_id). If they reviewed this product before,
  // we update the rating + body (and keep order_item_id as the most recent
  // verified-purchase link). Otherwise we insert.
  const { data: existing } = await admin
    .from('product_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', item.product_id)
    .maybeSingle()

  if (existing) {
    const { data: review, error } = await admin
      .from('product_reviews')
      .update({
        rating,
        body: text,
        order_item_id: orderItemId,
        image_urls: imageUrls,
        // Un-hide an updated review — admin can re-hide if needed, but a
        // moderated review that the customer re-submits is effectively a new
        // contribution. Keep the same row id so links stay stable.
        is_hidden: false,
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ review, updated: true })
  }

  const { data: review, error } = await admin
    .from('product_reviews')
    .insert({
      product_id: item.product_id,
      user_id: user.id,
      order_item_id: orderItemId,
      rating,
      body: text,
      image_urls: imageUrls,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      // Race condition (two parallel POSTs) — re-fetch and return existing.
      const { data: ex } = await admin
        .from('product_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', item.product_id)
        .single()
      if (ex) return NextResponse.json({ review: ex, updated: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review, updated: false })
}

/**
 * GET /api/reviews?productId=… — public list of reviews for a product.
 */
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, product_id, rating, body, image_urls, created_at, user:users(full_name)')
    .eq('product_id', productId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ reviews: [], average: null, count: 0 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const reviews = data ?? []
  const count = reviews.length
  const average =
    count === 0
      ? null
      : Math.round((reviews.reduce((acc, r) => acc + (r.rating as number), 0) / count) * 10) / 10
  return NextResponse.json({ reviews, count, average })
}
