'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'
import OrderDetailDialog from './order-detail-dialog'
import { summarizeItems, type OrderItemWithProduct } from '@/lib/orders'
import type { Order, OrderStatus, OrderStatusHistory } from '@/types'

export type AdminOrderRow = Order & {
  items?: OrderItemWithProduct[]
  user: { full_name: string | null; phone: string | null } | null
  address: { full_address: string; city: string; state: string; pincode: string } | null
  order_status_history: OrderStatusHistory[]
}

type Segment = 'active' | 'complete'

// "Active" = still needs a move through the pipeline; "Complete" = terminal.
const SEGMENT_STATUSES: Record<Segment, OrderStatus[]> = {
  active: ['pending', 'confirmed', 'shipped'],
  complete: ['delivered', 'cancelled'],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

type StatusFilter = OrderStatus | 'all'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function OrdersBoard({ initial }: { initial: AdminOrderRow[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrderRow[]>(initial)
  // Re-sync with fresh server data after router.refresh() (new `initial`
  // reference). Adjusting state during render is React's recommended pattern
  // for deriving from a changed prop — no effect, no cascading render.
  const [prevInitial, setPrevInitial] = useState(initial)
  if (initial !== prevInitial) {
    setPrevInitial(initial)
    setOrders(initial)
  }

  const [segment, setSegment] = useState<Segment>('active')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }
    for (const o of orders) c[o.status]++
    return c
  }, [orders])

  const segmentStatuses = SEGMENT_STATUSES[segment]
  const segmentTotal = segmentStatuses.reduce((acc, s) => acc + counts[s], 0)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const inSegment = segmentStatuses.includes(o.status)
      if (!inSegment) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (!q) return true
      const itemMatch =
        o.items?.some(
          (it) =>
            it.product?.name?.toLowerCase().includes(q) ||
            it.variant_label?.toLowerCase().includes(q),
        ) ?? false
      return (
        o.id.toLowerCase().includes(q) ||
        (o.user?.full_name?.toLowerCase().includes(q) ?? false) ||
        itemMatch
      )
    })
  }, [orders, segmentStatuses, statusFilter, search])

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  )

  function switchSegment(next: Segment) {
    setSegment(next)
    setStatusFilter('all')
  }

  function handleUpdated(patch: {
    id: string
    status: OrderStatus
    estimated_delivery_date: string | null
    order_status_history: OrderStatusHistory[]
  }) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === patch.id
          ? {
              ...o,
              status: patch.status,
              estimated_delivery_date: patch.estimated_delivery_date,
              order_status_history: patch.order_status_history,
            }
          : o,
      ),
    )
    // Re-sync server-derived counts (e.g. sidebar pending badges).
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Active vs Complete — primary split */}
      <div className="inline-flex rounded-xl border border-border bg-surface-muted p-1">
        {(['active', 'complete'] as Segment[]).map((s) => {
          const total = SEGMENT_STATUSES[s].reduce((acc, st) => acc + counts[st], 0)
          return (
            <button
              key={s}
              type="button"
              onClick={() => switchSegment(s)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                segment === s
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
              <span className="ml-1.5 text-xs text-text-subtle">({total})</span>
            </button>
          )
        })}
      </div>

      {/* Per-status sub-tabs within the active segment */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
        {(['all', ...segmentStatuses] as StatusFilter[]).map((s) => {
          const label = s === 'all' ? `All ${segment}` : STATUS_LABELS[s]
          const count = s === 'all' ? segmentTotal : counts[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === s
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              <span className="ml-1.5 text-xs text-text-subtle">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Search — extra top padding so it sits clear of the tab row above. */}
      <div className="pt-3 sm:pt-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, customer, product…"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-12 text-center text-sm text-muted-foreground">
          {search.trim() ? `No orders match "${search.trim()}".` : 'No orders in this section.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((order) => {
                const summary = summarizeItems(order.items)
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className="cursor-pointer transition-colors hover:bg-muted/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {order.user?.full_name ?? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.user_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {summary.primaryName}
                      {summary.extraCount > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">+{summary.extraCount}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-foreground">
                      ₹{order.amount_paid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailDialog
        key={selected?.id ?? 'none'}
        order={selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
