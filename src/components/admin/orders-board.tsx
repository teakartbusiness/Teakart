'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import StatusSelect from './status-select'
import { summarizeItems, type OrderItemWithProduct } from '@/lib/orders'
import { nextOrderStatuses } from '@/lib/status-progression'
import type { Order, OrderStatus } from '@/types'

type OrderRow = Order & {
  items?: OrderItemWithProduct[]
  user: { full_name: string | null } | null
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

type StatusFilter = OrderStatus | 'all'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function OrdersBoard({ initial }: { initial: OrderRow[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderRow[]>(initial)
  // Keep in step with fresh server data after router.refresh() (e.g. once a
  // status update commits) — useState only seeds from `initial` on mount.
  useEffect(() => {
    setOrders(initial)
  }, [initial])
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }
    for (const o of orders) {
      c[o.status]++
    }
    return c
  }, [orders])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (activeStatus !== 'all' && o.status !== activeStatus) {
        return false
      }

      // Search filter
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
  }, [orders, activeStatus, search])

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    const previous = orders
    setUpdatingId(orderId)

    // Optimistic update — revert on failure.
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error ?? 'Failed to update status')
      setOrders(previous)
    } else {
      toast.success(`Order marked as ${newStatus}.`)
      router.refresh()
    }

    setUpdatingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Status tabs */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
        {(['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveStatus(s)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              activeStatus === s
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {FILTER_LABELS[s]}
            <span className="ml-1.5 text-xs text-text-subtle">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Search — generous pt-6 to clearly separate from the tab row above,
          tighter pb-1 since the orders table below already has its own border. */}
      <div className="pt-6 pb-1">
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
          {search.trim()
            ? `No orders match "${search.trim()}".`
            : 'No orders in this section.'}
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
                  <tr key={order.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-foreground hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.user?.full_name ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {order.user_id.slice(0, 8)}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {summary.primaryName}
                        {summary.extraCount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            +{summary.extraCount}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-foreground">
                      ₹{order.amount_paid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        value={order.status}
                        options={nextOrderStatuses(order.status)}
                        onChange={(next) => updateStatus(order.id, next)}
                        disabled={updatingId === order.id || order.status === 'cancelled' || order.status === 'delivered'}
                        ariaLabel={`Status for order ${order.id.slice(0, 8)}`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
