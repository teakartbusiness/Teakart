'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductReview } from '@/types'

type Row = ProductReview & {
  product: { name: string; slug: string; category: { slug: string } | null } | null
  user: { full_name: string | null } | null
}

export default function AdminReviewsList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(row: Row) {
    setBusy(row.id)
    try {
      const res = await fetch(`/api/reviews/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: !row.is_hidden }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Failed to update')
      }
      const next = await res.json() as { review: { is_hidden: boolean } }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_hidden: next.review.is_hidden } : r)))
      toast.success(next.review.is_hidden ? 'Hidden from product page' : 'Restored')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        No reviews yet.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const productHref = r.product?.slug && r.product.category?.slug
          ? `/products/${r.product.category.slug}/${r.product.slug}`
          : '/products'
        return (
          <li
            key={r.id}
            className={`rounded-2xl border border-border bg-card p-5 ${r.is_hidden ? 'opacity-60' : ''}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <Link href={productHref} className="text-sm font-medium text-foreground hover:underline">
                  {r.product?.name ?? 'Product'}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.user?.full_name ?? 'Customer'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    width={14}
                    height={14}
                    className={n <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}
                  />
                ))}
              </span>
            </div>
            {r.body && (
              <p className="mt-3 whitespace-pre-line text-sm text-foreground">{r.body}</p>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => toggle(r)}
                disabled={busy === r.id}
                className={
                  r.is_hidden
                    ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60'
                    : 'rounded-lg border border-destructive bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive-soft disabled:opacity-60'
                }
              >
                {busy === r.id ? '…' : r.is_hidden ? 'Restore' : 'Hide'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
