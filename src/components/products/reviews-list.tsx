'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import type { ProductReview } from '@/types'

type ReviewRow = Pick<ProductReview, 'id' | 'rating' | 'body' | 'image_urls' | 'created_at'> & {
  user?: { full_name: string | null } | null
}

interface Props {
  reviews: ReviewRow[]
}

/**
 * Client-side renderer for the product page's reviews section. Owns:
 *   - The thumbnail strip at the top (every review image, scrollable row).
 *   - Each review card (text + own thumbnail if any).
 *   - The lightbox overlay shared by both — clicking ANY image from either
 *     surface opens the same viewer at the right index.
 *
 * Lightbox supports prev/next buttons + keyboard arrows + Escape to close.
 */
export default function ReviewsList({ reviews }: Props) {
  // Flat list of every image URL across all reviews, in the order reviews
  // appear (newest first since the parent already sorts that way). This is
  // the index space the lightbox iterates.
  const allImages = useMemo(() => {
    const out: { url: string; reviewId: string }[] = []
    for (const r of reviews) {
      for (const url of r.image_urls ?? []) {
        out.push({ url, reviewId: r.id })
      }
    }
    return out
  }, [reviews])

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Map review.id → index of its FIRST image in the flat list, so a click
  // on a review card's own thumbnail opens the lightbox at that image
  // rather than at index 0.
  const firstImageIndexByReview = useMemo(() => {
    const m = new Map<string, number>()
    allImages.forEach((entry, i) => {
      if (!m.has(entry.reviewId)) m.set(entry.reviewId, i)
    })
    return m
  }, [allImages])

  return (
    <>
      {/* Image strip — only renders if any review has an image. */}
      {allImages.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
          {allImages.map((img, i) => (
            <button
              key={`${img.reviewId}-${i}`}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Open review image ${i + 1} of ${allImages.length}`}
              className="relative size-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-border transition-all duration-150 ease-out hover:ring-border-strong active:scale-[0.97] sm:size-20"
            >
              <Image
                src={img.url}
                alt={`Customer photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {r.user?.full_name ?? 'Customer'}
              </p>
              <StarRating rating={r.rating} />
            </div>
            {r.body && (
              <p className="mt-2 whitespace-pre-line text-sm text-foreground">{r.body}</p>
            )}
            {r.image_urls && r.image_urls.length > 0 && (
              <div className="mt-3 flex gap-2">
                {r.image_urls.map((url, j) => {
                  const idx = firstImageIndexByReview.get(r.id)
                  // For a 1-image-per-review world this is just `idx`, but if
                  // we ever allow multiple per review the offset keeps it right.
                  const target = idx === undefined ? 0 : idx + j
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setOpenIndex(target)}
                      className="relative size-20 overflow-hidden rounded-lg ring-1 ring-border transition-all duration-150 ease-out hover:ring-border-strong active:scale-[0.97]"
                    >
                      <Image
                        src={url}
                        alt={`Photo from ${r.user?.full_name ?? 'customer'}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <ImageLightbox
          images={allImages.map((a) => a.url)}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={(i) => setOpenIndex(i)}
        />
      )}
    </>
  )
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

