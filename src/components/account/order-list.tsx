import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'
import { summarizeItems, type OrderItemWithProduct } from '@/lib/orders'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg ring-status-pending-ring',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-fg ring-status-confirmed-ring',
  shipped: 'bg-status-shipped-bg text-status-shipped-fg ring-status-shipped-ring',
  delivered: 'bg-status-delivered-bg text-status-delivered-fg ring-status-delivered-ring',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg ring-status-cancelled-ring',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

type OrderWithItems = Order & { items?: OrderItemWithProduct[] }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function OrderList({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-foreground">No orders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place an order, it&apos;ll show up here.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const { primaryName, primaryImage, extraCount } = summarizeItems(order.items)

        return (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-all duration-150 ease-out hover:border-border-strong hover:bg-muted/40 active:scale-[0.99] sm:p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-base font-medium text-foreground">
                  {primaryName}
                  {extraCount > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      +{extraCount} more
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  ₹{order.amount_paid.toLocaleString('en-IN')}
                </p>
              </div>

              <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
