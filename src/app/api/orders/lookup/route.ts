import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Lookup is polled from the order-confirmation page right after payment.
// Edge keeps that poll cheap and snappy.
export const runtime = 'edge'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Razorpay order ids look like `order_xxxxxxxxxxxxxx`.
const RAZORPAY_ID_REGEX = /^order_[A-Za-z0-9]{8,30}$/

/**
 * Tells the confirmation page whether the user's order has landed in our DB
 * yet (the webhook is what creates the row; the polling endpoint sits in
 * the gap).
 *
 * Hardening details:
 *   - Authenticated only — 401 for everyone else.
 *   - Per-user rate limit (60/min) so a logged-in attacker can't brute-force
 *     enumerate the order-id space. Legitimate polling is ~30 requests/min.
 *   - Key is regex-validated to either a UUID or a Razorpay order id. Any
 *     other shape gets `found: false` without touching the DB.
 *   - RLS on `orders` enforces "user can only see own". A row owned by a
 *     different user is invisible here — maybeSingle() returns null, and
 *     we respond identically to a "row doesn't exist" case. So the response
 *     can't distinguish "exists for someone else" from "doesn't exist".
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = await checkRateLimit(
    request,
    { name: 'order-lookup', requests: 60, window: '1 m' },
    user.id,
  )
  if (!limit.ok) return rateLimitResponse(limit.retryAfter)

  const key = request.nextUrl.searchParams.get('key')
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  let lookupColumn: 'id' | 'razorpay_order_id'
  if (UUID_REGEX.test(key)) lookupColumn = 'id'
  else if (RAZORPAY_ID_REGEX.test(key)) lookupColumn = 'razorpay_order_id'
  else return NextResponse.json({ found: false })

  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq(lookupColumn, key)
    .maybeSingle()

  return NextResponse.json({ found: Boolean(data) })
}
