'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { nextOrderStatuses } from '@/lib/status-progression'
import type { OrderStatus } from '@/types'

interface Props {
  orderId: string
  currentStatus: OrderStatus
  /** Current estimated delivery date (YYYY-MM-DD) or null. */
  currentEstimatedDelivery?: string | null
  onSuccess: () => void
}

export default function OrderStatusForm({
  orderId,
  currentStatus,
  currentEstimatedDelivery,
  onSuccess,
}: Props) {
  // Only show current + the single next allowed status. Strict forward
  // progression — no skipping pending → shipped.
  const STATUSES = nextOrderStatuses(currentStatus)
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [estDelivery, setEstDelivery] = useState<string>(currentEstimatedDelivery ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const payload: Record<string, unknown> = {}
    if (status !== currentStatus) payload.status = status
    if (note.trim()) payload.note = note.trim()
    if ((estDelivery || '') !== (currentEstimatedDelivery ?? '')) {
      payload.estimated_delivery_date = estDelivery || null
    }

    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to update.')
      setSubmitting(false)
      return
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Request failed' }))
      toast.error(msg ?? 'Request failed')
      setSubmitting(false)
      return
    }

    toast.success('Order updated.')
    setNote('')
    setSubmitting(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-card capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Estimated delivery date <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={estDelivery}
            onChange={(e) => setEstDelivery(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-card text-sm"
          />
          {estDelivery && (
            <button
              type="button"
              onClick={() => setEstDelivery('')}
              className="shrink-0 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Shown to the customer on their order. Leave blank to hide it.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Note <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Internal note for this status update…"
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 rounded-md transition-colors"
        >
          {submitting ? 'Updating…' : 'Update order'}
        </button>
      </div>
    </form>
  )
}
