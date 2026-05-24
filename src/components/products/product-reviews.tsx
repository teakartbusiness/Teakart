import { Star } from 'lucide-react'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import ReviewsList from './reviews-list'
import type { ProductReview } from '@/types'

interface Props {
  productId: string
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          width={size}
          height={size}
          className={n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}
        />
      ))}
    </span>
  )
}

/**
 * Reviews section on the product detail page. Fetches the data server-side
 * and hands it to ReviewsList (client) which owns the image strip,
 * per-card thumbnails, and the shared lightbox.
 */
export default async function ProductReviews({ productId }: Props) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('product_reviews')
    .select('id, rating, body, image_urls, created_at, user:users(full_name)')
    .eq('product_id', productId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return null

  type ReviewRow = Pick<ProductReview, 'id' | 'rating' | 'body' | 'image_urls' | 'created_at'> & {
    user?: { full_name: string | null } | null
  }
  // Supabase returns embedded `user` as an array or single — normalize.
  const reviews: ReviewRow[] = data.map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    body: r.body as string | null,
    image_urls: (r.image_urls ?? []) as string[],
    created_at: r.created_at as string,
    user: Array.isArray(r.user) ? r.user[0] ?? null : (r.user as { full_name: string | null } | null),
  }))
  const count = reviews.length
  const average =
    count === 0 ? null : Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / count) * 10) / 10

  if (count === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first.
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Reviews
        </h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(average ?? 0)} />
          <span className="text-sm tabular-nums text-foreground">
            {average?.toFixed(1) ?? '—'}{' '}
            <span className="text-muted-foreground">({count})</span>
          </span>
        </div>
      </header>

      <ReviewsList reviews={reviews} />
    </section>
  )
}
