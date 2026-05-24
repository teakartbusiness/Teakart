import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import OrderStatusTimeline from '@/components/account/order-status-timeline'
import OrderHeroImages from '@/components/account/order-hero-images'
import ReviewPanel from '@/components/account/review-panel'
import { ORDER_ITEMS_SELECT, sortItems, type OrderItemWithProduct } from '@/lib/orders'
import type {
  OrderStatusHistory,
  OrderStatus,
} from '@/types'

export const metadata: Metadata = {
  title: 'Order',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/** Format a YYYY-MM-DD date for display (no timezone drift). */
function formatDeliveryDate(d: string | null | undefined): string | null {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      ${ORDER_ITEMS_SELECT},
      address:addresses ( full_address, city, state, pincode ),
      order_status_history ( id, status, note, created_at )
    `)
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user!.id) {
    notFound()
  }

  const items = sortItems((order.items ?? []) as OrderItemWithProduct[])
  const address = order.address as { full_address: string; city: string; state: string; pincode: string } | null
  const history = (order.order_status_history ?? []) as OrderStatusHistory[]

  const orderStatus = order.status as OrderStatus
  const estimatedDelivery = formatDeliveryDate(
    (order as { estimated_delivery_date?: string | null }).estimated_delivery_date,
  )

  // Existing reviews + review settings, so the review panel can prefill the
  // modal for editing and enforce the per-review image cap.
  const admin = getSupabaseAdminClient()
  const [
    { data: reviews },
    { data: reviewSettings },
  ] = await Promise.all([
    // Fetch this user's reviews for any product in this order. Uniqueness
    // is per (user_id, product_id), so the lookup is by product_id.
    admin
      .from('product_reviews')
      .select('id, product_id, rating, body, image_urls')
      .eq('user_id', user!.id)
      .in('product_id', Array.from(new Set(items.map((it) => it.product_id)))),
    admin
      .from('review_settings')
      .select('max_images_per_review')
      .eq('id', 1)
      .maybeSingle(),
  ])
  const maxReviewImages =
    typeof reviewSettings?.max_images_per_review === 'number'
      ? Math.max(0, Math.min(10, reviewSettings.max_images_per_review))
      : 1

  // Map product_id → existing review so the panel can prefill the modal
  // for editing (rating + body + images) and switch the CTA to "Edit review".
  const existingByProduct = new Map(
    ((reviews ?? []) as {
      id: string
      product_id: string
      rating: number
      body: string | null
      image_urls: string[] | null
    }[]).map((r) => [r.product_id, r]),
  )

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs text-muted-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Hero card — multi-item collage + order total. */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <OrderHeroImages items={items} />

          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your order
            </h1>
            {items.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 text-foreground"
                  >
                    <span className="flex-1">
                      <span className="font-medium">{item.product?.name ?? 'Product'}</span>
                      {item.variant_label && (
                        <span className="text-muted-foreground"> · {item.variant_label}</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      )}
                    </span>
                    <span className="tabular-nums">
                      ₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Items unavailable.</p>
            )}

            <p className="border-t border-border pt-3 text-lg font-semibold tabular-nums text-foreground">
              ₹{order.amount_paid.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </section>

      {address && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Delivery address
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {address.full_address}, {address.city}, {address.state} — {address.pincode}
          </p>
        </section>
      )}

      {estimatedDelivery && orderStatus !== 'delivered' && orderStatus !== 'cancelled' && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Estimated delivery
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground">{estimatedDelivery}</p>
        </section>
      )}

      {orderStatus === 'delivered' && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Receipt
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Download a printable PDF receipt for this order.
          </p>
          <Link
            href={`/account/orders/${order.id}/receipt`}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Get receipt →
          </Link>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Order history
        </h2>
        <div className="mt-4">
          <OrderStatusTimeline history={history} />
        </div>
      </section>

      {orderStatus === 'delivered' && (
        <ReviewPanel
          maxImages={maxReviewImages}
          items={items.map((it) => {
            const existing = existingByProduct.get(it.product_id) ?? null
            return {
              id: it.id,
              product_id: it.product_id,
              productName: it.product?.name ?? 'Item',
              variantLabel: it.variant_label,
              existingReview: existing
                ? {
                    id: existing.id,
                    rating: existing.rating,
                    body: existing.body,
                    imageUrls: existing.image_urls ?? [],
                  }
                : null,
            }
          })}
        />
      )}
    </div>
  )
}
