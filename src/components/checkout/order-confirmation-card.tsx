import Link from 'next/link'
import OrderHeroImages from '@/components/account/order-hero-images'
import type { OrderItemWithProduct } from '@/lib/orders'
import type { OrderStatus, PaymentStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
}

export type OrderConfirmationData = {
  id: string
  amount_paid: number
  status: OrderStatus
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  created_at: string
  items: OrderItemWithProduct[]
  formattedAddress: string
}

function formatPlaced(createdAt: string) {
  return new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function HeadlineTitle({ items }: { items: OrderItemWithProduct[] }) {
  if (items.length === 0) return <>—</>
  if (items.length === 1) return <>{items[0]?.product?.name ?? '—'}</>
  return <>{items.length} items</>
}

function ItemsList({ items }: { items: OrderItemWithProduct[] }) {
  if (items.length === 0) return null
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-3 py-3 text-sm">
          <span className="flex-1 text-foreground">
            <span className="font-medium">{item.product?.name ?? 'Product'}</span>
            {item.variant_label && <span className="text-muted-foreground"> · {item.variant_label}</span>}
            {item.quantity > 1 && <span className="text-muted-foreground"> × {item.quantity}</span>}
          </span>
          <span className="tabular-nums text-foreground">
            ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
          </span>
        </li>
      ))}
    </ul>
  )
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-status-pending-bg px-3 py-1 text-xs font-medium text-status-pending-fg ring-1 ring-inset ring-status-pending-ring capitalize">
      {STATUS_LABELS[status]}
    </span>
  )
}

export default function OrderConfirmationCard({ order }: { order: OrderConfirmationData }) {
  const placedAt = formatPlaced(order.created_at)

  return (
    <article className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {PAYMENT_LABELS[order.payment_status]}
        </p>
        <StatusPill status={order.status} />
      </div>

      <h2 className="mt-3 px-6 text-xl font-semibold text-foreground sm:px-8">
        <HeadlineTitle items={order.items} />
      </h2>

      <div className="mt-5 px-6 sm:px-8">
        <OrderHeroImages
          items={order.items}
          imageWrapperClassName="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border"
        />
      </div>

      <div className="mx-6 mt-6 flex items-baseline justify-between gap-4 border-t border-border pt-5 sm:mx-8">
        <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Total paid</span>
        <span className="text-xl font-semibold tabular-nums text-foreground">
          ₹{order.amount_paid.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="mx-6 mt-4 sm:mx-8">
        <ItemsList items={order.items} />
      </div>

      <dl className="mx-6 mt-5 grid grid-cols-1 gap-5 sm:mx-8 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order ID</dt>
          <dd className="mt-1 break-all font-mono text-xs text-foreground">{order.id}</dd>
          <dt className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Placed</dt>
          <dd className="mt-1 text-sm text-foreground">{placedAt} · Razorpay</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivered to</dt>
          <dd className="mt-1 text-sm text-foreground">{order.formattedAddress}</dd>
        </div>
      </dl>

      <div className="mx-6 mt-6 mb-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6 sm:mx-8 sm:mb-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          View all orders
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-150 ease-out hover:bg-muted active:scale-[0.98]"
        >
          Keep shopping
        </Link>
      </div>
    </article>
  )
}
