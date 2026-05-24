import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const DEFAULTS = { max_images_per_review: 1 }

async function requireAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('reviews.settings'))) return null
  return user
}

/**
 * GET /api/review-settings — readable by anyone (the review modal on the
 * customer's side needs the image cap before they upload).
 */
export async function GET() {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('review_settings')
    .select('max_images_per_review, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || /review_settings/i.test(error.message)) {
      return NextResponse.json({ ...DEFAULTS, updated_at: null })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? { ...DEFAULTS, updated_at: null })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (typeof body.max_images_per_review !== 'number') {
    return NextResponse.json(
      { error: 'max_images_per_review must be a number' },
      { status: 400 },
    )
  }
  const n = Math.round(body.max_images_per_review)
  if (n < 0 || n > 10) {
    return NextResponse.json(
      { error: 'max_images_per_review must be between 0 and 10' },
      { status: 400 },
    )
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('review_settings')
    .update({ max_images_per_review: n })
    .eq('id', 1)
    .select('max_images_per_review, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
