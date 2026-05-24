'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ImagePlus, Star, X } from 'lucide-react'
import { toast } from 'sonner'

type ExistingReview = {
  id: string
  rating: number
  body: string | null
  imageUrls: string[]
}

type Item = {
  id: string
  product_id: string
  productName: string
  variantLabel: string | null
  /** The customer's existing review for this product, if any. */
  existingReview: ExistingReview | null
}

interface Props {
  items: Item[]
  /** Admin-configurable cap on images per review (0–10). */
  maxImages: number
}

export default function ReviewPanel({ items, maxImages }: Props) {
  const [openFor, setOpenFor] = useState<Item | null>(null)
  const router = useRouter()

  // Dedupe by product_id — only ONE review per product per customer, so
  // even if the order has the same product across multiple lines, the
  // panel should surface a single row for that product. Pick the first
  // line we see; its order_item_id satisfies the verified-purchase link.
  const dedupedItems = useMemo(() => {
    const seen = new Set<string>()
    return items.filter((it) => {
      if (seen.has(it.product_id)) return false
      seen.add(it.product_id)
      return true
    })
  }, [items])

  if (dedupedItems.length === 0) return null

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Share your experience
      </h2>
      <ul className="mt-3 space-y-2">
        {dedupedItems.map((it) => {
          const existing = it.existingReview
          return (
            <li
              key={it.product_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{it.productName}</p>
                {existing && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          aria-hidden
                          width={12}
                          height={12}
                          className={n <= existing.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}
                        />
                      ))}
                    </span>
                    Your review · {existing.rating}/5
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenFor(it)}
                className={
                  existing
                    ? 'rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-transform duration-150 ease-out hover:bg-muted active:scale-[0.98]'
                    : 'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.98]'
                }
              >
                {existing ? 'Edit review' : 'Write a review'}
              </button>
            </li>
          )
        })}
      </ul>

      {openFor && (
        <ReviewModal
          item={openFor}
          maxImages={maxImages}
          onClose={() => setOpenFor(null)}
          onSaved={(updated) => {
            setOpenFor(null)
            toast.success(updated ? 'Review updated.' : 'Thanks for the review!')
            router.refresh()
          }}
        />
      )}
    </section>
  )
}

function ReviewModal({
  item,
  maxImages,
  onClose,
  onSaved,
}: {
  item: Item
  maxImages: number
  onClose: () => void
  onSaved: (updated: boolean) => void
}) {
  const existing = item.existingReview
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [body, setBody] = useState(existing?.body ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>(existing?.imageUrls ?? [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = imageUrls.length < maxImages

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/review-image', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Upload failed')
      }
      const data = (await res.json()) as { url: string }
      setImageUrls((prev) => [...prev, data.url].slice(0, maxImages))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      toast.error('Pick a star rating')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: item.id,
          rating,
          body: body.trim() || null,
          imageUrls,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Could not submit')
      }
      const data = (await res.json()) as { updated?: boolean }
      onSaved(Boolean(data.updated))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-foreground">
          {existing ? 'Edit your review of' : 'Review'} {item.productName}
        </h3>
        {existing && (
          <p className="mt-1 text-xs text-muted-foreground">
            You can only have one review per product. Saving overwrites your previous one.
          </p>
        )}

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-foreground">Rating</legend>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hoverRating || rating) >= n
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="rounded p-1 transition-transform duration-150 ease-out active:scale-90"
                >
                  <Star
                    className={`size-7 ${active ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                  />
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm">
          <span className="text-foreground">Your thoughts (optional)</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={4000}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="What did you love? Anything off?"
          />
        </label>

        {maxImages > 0 && (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-foreground">
              Photos{' '}
              <span className="text-xs font-normal text-muted-foreground">
                {imageUrls.length} / {maxImages}
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <div
                  key={url}
                  className="relative size-20 overflow-hidden rounded-lg ring-1 ring-border"
                >
                  <Image src={url} alt={`Upload ${i + 1}`} fill sizes="80px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    className="absolute right-0.5 top-0.5 inline-flex size-5 items-center justify-center rounded-full bg-foreground/70 text-primary-foreground transition-transform duration-150 ease-out hover:scale-110"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-background text-xs text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted disabled:opacity-60"
                >
                  {uploading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  ) : (
                    <ImagePlus className="size-5" />
                  )}
                  <span>{uploading ? 'Uploading' : 'Add image'}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadFile(file)
                // Allow re-selecting the same file later.
                e.target.value = ''
              }}
            />
          </fieldset>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || rating < 1}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : existing ? 'Save changes' : 'Submit review'}
          </button>
        </div>
      </form>
    </div>
  )
}
