import { Star } from 'lucide-react'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

interface Props {
  productId: string
  /** When the section anchor below isn't on the same page, omit this and the
   *  count won't be a link. */
  reviewsAnchor?: string
}

/**
 * Small star-strip + average + count that sits under the product title.
 * Server-rendered — keeps the product page entirely static-friendly except
 * for the one extra DB read which is cheap (indexed scan on product_id).
 *
 * Empty state (no reviews): "Be the first to review it".
 */
export default async function ProductRatingSummary({ productId, reviewsAnchor }: Props) {
  let count = 0
  let average: number | null = null

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('product_reviews')
      .select('rating', { count: 'exact' })
      .eq('product_id', productId)
      .eq('is_hidden', false)

    if (!error && data) {
      count = data.length
      if (count > 0) {
        const sum = data.reduce((acc, r) => acc + (r.rating as number), 0)
        average = Math.round((sum / count) * 10) / 10
      }
    }
  } catch {
    // Table may not exist yet (migration not run). Treat as empty.
  }

  if (count === 0 || average === null) {
    return (
      <p className="text-sm text-muted-foreground">Be the first to review it.</p>
    )
  }

  // Round to whole stars for the strip; show the decimal next to it.
  const filled = Math.round(average)

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-0.5"
        aria-label={`Rated ${average} out of 5 from ${count} review${count === 1 ? '' : 's'}`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            width={16}
            height={16}
            className={n <= filled ? 'fill-warning text-warning' : 'text-muted-foreground'}
          />
        ))}
      </span>
      <span className="text-sm tabular-nums text-foreground">{average.toFixed(1)}</span>
      {reviewsAnchor ? (
        <a
          href={reviewsAnchor}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ({count} review{count === 1 ? '' : 's'})
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">
          ({count} review{count === 1 ? '' : 's'})
        </span>
      )}
    </div>
  )
}
