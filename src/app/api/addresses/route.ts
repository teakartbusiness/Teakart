import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

const MAX_ADDRESS = 500
const MAX_CITY = 100
const MAX_STATE = 100
// Generous to accommodate international formats if we ever expand.
const PINCODE_REGEX = /^[A-Za-z0-9 -]{3,20}$/

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 30 address writes per hour per user is more than enough for normal use.
  const rl = await checkRateLimit(request, { name: 'address-write', requests: 30, window: '1 h' }, user.id)
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

  const body = (await request.json().catch(() => ({}))) as {
    full_address?: unknown
    city?: unknown
    state?: unknown
    pincode?: unknown
  }

  const full_address = typeof body.full_address === 'string' ? body.full_address.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const state = typeof body.state === 'string' ? body.state.trim() : ''
  const pincode = typeof body.pincode === 'string' ? body.pincode.trim() : ''

  if (!full_address || !city || !state || !pincode) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (full_address.length > MAX_ADDRESS) {
    return NextResponse.json({ error: `Address is too long (max ${MAX_ADDRESS} chars)` }, { status: 400 })
  }
  if (city.length > MAX_CITY) {
    return NextResponse.json({ error: `City is too long (max ${MAX_CITY} chars)` }, { status: 400 })
  }
  if (state.length > MAX_STATE) {
    return NextResponse.json({ error: `State is too long (max ${MAX_STATE} chars)` }, { status: 400 })
  }
  if (!PINCODE_REGEX.test(pincode)) {
    return NextResponse.json({ error: 'Pincode looks invalid' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({ user_id: user.id, full_address, city, state, pincode })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
