import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import OrderStatusTimeline from '@/components/account/order-status-timeline'
import OrderStatusFormWrapper from '@/components/admin/order-status-form-wrapper'
import { ORDER_ITEMS_SELECT, sortItems, type OrderItemWithProduct } from '@/lib/orders'
import type {
  Order,
  OrderStatusHistory,
} from '@/types'

export const dynamic = 'force-dynamic'

type OrderDetail = Order & {
  items?: OrderItemWithProduct[]
  address: {
    full_address: string
    city: string
    state: string
    pincode: string
  } | null
  user: { full_name: string | null; phone: string | null } | null
  order_status_history: OrderStatusHistory[]
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await guardPage('orders.view')
  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      ${ORDER_ITEMS_SELECT},
      address:addresses ( full_address, city, state, pincode ),
      user:users ( full_name, phone ),
      order_status_history ( id, order_id, status, note, created_at )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const order = data as OrderDetail
  const items = sortItems(order.items ?? [])
  const heroItem = items[0]
  const heroImages = heroItem?.product?.images ?? []
  const hero =
    [...heroImages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0] ?? null

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Orders
        </Link>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Order <span className="font-mono">#{order.id.slice(0, 8)}</span>
          </h1>
          <span className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Customer
          </h2>
          <div>
            <p className="text-foreground font-medium">
              {order.user?.full_name ?? <span className="text-text-subtle italic">No name</span>}
            </p>
            {order.user?.phone && (
              <p className="text-sm text-foreground mt-0.5">{order.user.phone}</p>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-1">{order.user_id}</p>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Delivery address
          </h2>
          {order.address ? (
            <div className="text-sm text-foreground space-y-0.5">
              <p>{order.address.full_address}</p>
              <p>
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-subtle italic">Address not available</p>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-5 md:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Items ({items.length})
          </h2>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const itemImages = item.product?.images ?? []
              const itemHero =
                [...itemImages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0] ?? null
              return (
                <li key={item.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                    {itemHero ? (
                      <Image
                        src={itemHero.url}
                        alt={item.product?.name ?? ''}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">
                      {item.product?.name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.variant_label ? `Size: ${item.variant_label} · ` : ''}
                      Qty: {item.quantity} · ₹{item.unit_price.toLocaleString('en-IN')} each
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums shrink-0">
                    ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground capitalize">
              Payment: {order.payment_status}
            </p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              ₹{order.amount_paid.toLocaleString('en-IN')}
            </p>
          </div>
          {hero && items.length === 0 && (
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border border-border shrink-0">
              <Image src={hero.url} alt="" fill sizes="80px" className="object-cover" />
            </div>
          )}
        </section>

      </div>

      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Status history
        </h2>
        <OrderStatusTimeline history={order.order_status_history ?? []} />
      </section>

      {order.status !== 'cancelled' && (
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Update order
          </h2>
          <OrderStatusFormWrapper
            orderId={order.id}
            currentStatus={order.status}
            currentEstimatedDelivery={order.estimated_delivery_date ?? null}
          />
        </section>
      )}
    </div>
  )
}
