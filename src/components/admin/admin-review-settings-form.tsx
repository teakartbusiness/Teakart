'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  initialMaxImages: number
}

/**
 * Small panel that lets the admin tune `review_settings.max_images_per_review`
 * (0 disables uploads, up to 10 if they want photo-rich reviews). Default 1.
 */
export default function AdminReviewSettingsForm({ initialMaxImages }: Props) {
  const [maxImages, setMaxImages] = useState(initialMaxImages)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/review-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_images_per_review: maxImages }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Could not save')
      }
      toast.success('Review settings updated.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Settings
      </h2>
      <label className="mt-3 block text-sm">
        <span className="text-foreground">Images allowed per review</span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          0 disables image uploads. Up to 10 if you want richer reviews.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={maxImages}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (Number.isFinite(n)) setMaxImages(Math.max(0, Math.min(10, n)))
            }}
            className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={saving || maxImages === initialMaxImages}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </label>
    </form>
  )
}
