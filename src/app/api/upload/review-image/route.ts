import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/cloudinary'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Customer-authed image upload, intended for product reviews.
 *
 * Tighter limits than the admin uploader:
 *   - 5 MB cap (smaller than admin's 10 MB since these aren't product hero
 *     shots; customer reviews don't need DSLR resolution).
 *   - Same MIME allowlist (jpeg / png / webp / gif / avif).
 *   - 10 uploads per minute per user — catches accidental loops without
 *     blocking real review writing.
 *
 * The image lands in Cloudinary under `reviews/` so admin-side deletion code
 * (which only allows deletes under `products/`) can't accidentally remove
 * customer-uploaded review imagery.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit(
    request,
    { name: 'review-image-upload', requests: 10, window: '1 m' },
    user.id,
  )
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File is too large — limit is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB` },
      { status: 413 },
    )
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Only image files are allowed (got ${file.type || 'unknown'})` },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url, public_id } = await uploadImage(buffer, 'reviews')

  return NextResponse.json({ url, public_id })
}
