import Link from 'next/link'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import { summarizeItems, type OrderItemWithProduct } from '@/lib/orders'
import type { Order, OrderStatus } from '@/types'

export const dynamic = 'force-dynamic'

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-fg',
  shipped: 'bg-status-shipped-bg text-status-shipped-fg',
  delivered: 'bg-status-delivered-bg text-status-delivered-fg',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg',
}

type RecentOrder = Pick<Order, 'id' | 'status' | 'created_at'> & {
  items?: OrderItemWithProduct[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminDashboardPage() {
  await guardPage('dashboard.view')
  const supabase = getSupabaseAdminClient()

  const [totalRes, statusRes, recentRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('status'),
    supabase
      .from('orders')
      .select('id, status, created_at, items:order_items(id, product_id, variant_label, unit_price, quantity, created_at, product:products(name, images))')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (totalRes.error || statusRes.error || recentRes.error) {
    const err = totalRes.error ?? statusRes.error ?? recentRes.error
    return (
      <div className="p-4 rounded-md bg-destructive-soft border border-destructive/30 text-sm text-destructive">
        Failed to load dashboard: {err?.message}
      </div>
    )
  }

  const totalOrders = totalRes.count ?? 0
  const recent = (recentRes.data ?? []) as unknown as RecentOrder[]

  const counts: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  for (const row of statusRes.data ?? []) {
    const s = row.status as OrderStatus
    if (s in counts) counts[s]++
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of orders and activity</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total orders
          </p>
          <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
            {totalOrders}
          </p>
        </div>

        {STATUSES.map((status) => (
          <div key={status} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide capitalize">
              {status}
            </p>
            <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
              {counts[status]}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {recent.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No orders yet.
            </div>
          )}
          {recent.map((order) => {
            const summary = summarizeItems(order.items)
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {summary.primaryName}
                    {summary.extraCount > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">+{summary.extraCount}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap w-20 text-right">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
