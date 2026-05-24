import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { Product } from '@/types'

interface Props {
  product: Product
  /** Optional pre-computed rating to avoid an extra DB read per card. */
  rating?: { average: number; count: number }
  /** Marks the top-selling product of its category. */
  isBestSeller?: boolean
}

export default function ProductCard({ product, rating, isBestSeller }: Props) {
  const heroImage = product.images[0]
  const href = product.category
    ? `/products/${product.category.slug}/${product.slug}`
    : `/products/${product.slug}`

  return (
    <Link href={href} className="group block transition-transform duration-150 ease-out focus-visible:outline-none active:scale-[0.99]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all duration-300 group-hover:ring-border-strong group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {(isBestSeller || product.is_sellers_choice) && (
          <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
            {isBestSeller && (
              <span className="rounded-2xl bg-warning px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-warning-foreground shadow-sm">
                Best seller
              </span>
            )}
            {product.is_sellers_choice && (
              <span className="rounded-2xl bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                Seller&apos;s choice
              </span>
            )}
          </div>
        )}
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-subtle">
            No image
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {product.category.name}
          </p>
        )}
        <h3 className="font-display text-base font-medium leading-snug text-foreground transition-colors group-hover:text-muted-foreground">
          {product.name}
        </h3>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          ₹{product.price.toLocaleString('en-IN')}
        </p>
        {rating && rating.count > 0 && (
          <CardRatingStrip rating={rating} />
        )}
      </div>
    </Link>
  )
}

/** Compact rating strip for product cards — 5 small stars + average + count.
 *  Inline (not a child component import) so it ships in the same module. */
function CardRatingStrip({ rating }: { rating: { average: number; count: number } }) {
  const filled = Math.round(rating.average)
  return (
    <p
      className="flex items-center gap-1 text-xs text-muted-foreground"
      aria-label={`Rated ${rating.average} out of 5 from ${rating.count} review${rating.count === 1 ? '' : 's'}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            width={12}
            height={12}
            className={n <= filled ? 'fill-warning text-warning' : 'text-muted-foreground'}
          />
        ))}
      </span>
      <span className="tabular-nums">
        {rating.average.toFixed(1)} <span className="text-text-subtle">({rating.count})</span>
      </span>
    </p>
  )
}
