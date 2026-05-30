'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import OrderStatusTimeline from '@/components/account/order-status-timeline'
import { StatusBadge } from './status-badge'
import DeliveryDateInput, { todayPlus } from './delivery-date-input'
import { sortItems } from '@/lib/orders'
import { nextOrderStatuses } from '@/lib/status-progression'
import type { AdminOrderRow } from './orders-board'
import type { OrderStatus, OrderStatusHistory } from '@/types'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  order: AdminOrderRow | null
  onOpenChange: (open: boolean) => void
  /** Called after a successful status advance so the board can update in place. */
  onUpdated: (patch: {
    id: string
    status: OrderStatus
    estimated_delivery_date: string | null
    order_status_history: OrderStatusHistory[]
  }) => void
}

export default function OrderDetailDialog({ order, onOpenChange, onUpdated }: Props) {
  // The board remounts this via a `key` tied to the order id, so seeding form
  // state directly from props is safe — no re-seed effect needed. When the
  // order has no ETA yet, prefill a sensible default of today + 7 days.
  const [note, setNote] = useState('')
  const [estDelivery, setEstDelivery] = useState(order?.estimated_delivery_date || todayPlus(7))
  const [submitting, setSubmitting] = useState(false)

  if (!order) return null

  const items = sortItems(order.items ?? [])

  const nextStatus = nextOrderStatuses(order.status).find((s) => s !== order.status) ?? null
  const estChanged = (estDelivery || '') !== (order.estimated_delivery_date ?? '')

  async function patch(payload: Record<string, unknown>, successMsg: string) {
    if (!order) return
    setSubmitting(true)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error ?? 'Update failed')
      setSubmitting(false)
      return
    }
    const updated = (await res.json()) as {
      status: OrderStatus
      estimated_delivery_date: string | null
      order_status_history: OrderStatusHistory[]
    }
    toast.success(successMsg)
    onUpdated({
      id: order.id,
      status: updated.status,
      estimated_delivery_date: updated.estimated_delivery_date ?? null,
      order_status_history: updated.order_status_history ?? [],
    })
    setNote('')
    setSubmitting(false)
  }

  function handleAdvance() {
    if (!nextStatus) return
    const payload: Record<string, unknown> = { status: nextStatus }
    if (note.trim()) payload.note = note.trim()
    if (estChanged) payload.estimated_delivery_date = estDelivery || null
    void patch(payload, `Order marked as ${nextStatus}.`)
  }

  function handleSaveDeliveryOnly() {
    void patch({ estimated_delivery_date: estDelivery || null }, 'Delivery date updated.')
  }

  const isTerminal = order.status === 'delivered' || order.status === 'cancelled'

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>
              Order <span className="font-mono">#{order.id.slice(0, 8)}</span>
            </DialogTitle>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDateTime(order.created_at)}</span>
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Full page <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Customer + address */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-muted p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</h3>
              <p className="mt-1.5 font-medium text-foreground">
                {order.user?.full_name ?? <span className="italic text-text-subtle">No name</span>}
              </p>
              {order.user?.phone && <p className="text-sm text-foreground">{order.user.phone}</p>}
              <p className="mt-1 font-mono text-xs text-muted-foreground">{order.user_id.slice(0, 18)}…</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery address</h3>
              {order.address ? (
                <div className="mt-1.5 space-y-0.5 text-sm text-foreground">
                  <p>{order.address.full_address}</p>
                  <p>
                    {order.address.city}, {order.address.state} — {order.address.pincode}
                  </p>
                </div>
              ) : (
                <p className="mt-1.5 text-sm italic text-text-subtle">Not available</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Items ({items.length})
            </h3>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {items.map((item) => {
                const imgs = item.product?.images ?? []
                const hero = [...imgs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0] ?? null
                return (
                  <li key={item.id} className="flex items-start gap-3 p-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {hero && (
                        <Image src={hero.url} alt={item.product?.name ?? ''} fill sizes="56px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{item.product?.name ?? '—'}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.variant_label ? `${item.variant_label} · ` : ''}
                        Qty {item.quantity} · ₹{item.unit_price.toLocaleString('en-IN')} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-xs capitalize text-muted-foreground">Payment: {order.payment_status}</span>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                ₹{order.amount_paid.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Status history */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status history</h3>
            <OrderStatusTimeline history={order.order_status_history ?? []} />
          </div>

          {/* Advance controls */}
          {!isTerminal && (
            <div className="rounded-xl border border-border bg-surface-muted p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Update order</h3>

              <div className="mt-3 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-foreground">
                      Estimated delivery date <span className="font-normal text-text-subtle">(optional)</span>
                    </label>
                    {estChanged && (
                      <button
                        type="button"
                        onClick={handleSaveDeliveryOnly}
                        disabled={submitting}
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        Save date
                      </button>
                    )}
                  </div>
                  <DeliveryDateInput value={estDelivery} onChange={setEstDelivery} disabled={submitting} />
                  {estDelivery && (
                    <button
                      type="button"
                      onClick={() => setEstDelivery('')}
                      disabled={submitting}
                      className="mt-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Clear date
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Note <span className="font-normal text-text-subtle">(optional, attached to the next step)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    disabled={submitting}
                    placeholder="Internal note for this status update…"
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {nextStatus ? (
            <button
              type="button"
              onClick={handleAdvance}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Updating…' : <>Mark as {nextStatus} <ArrowRight className="size-4" /></>}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              This order is <span className="font-medium capitalize text-foreground">{order.status}</span>. No further action.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
