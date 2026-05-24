import { notFound, redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import ReceiptView from '@/components/account/receipt-view'
import { ORDER_ITEMS_SELECT, sortItems, type OrderItemWithProduct } from '@/lib/orders'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
}

/**
 * Customer-facing printable receipt. Available only after the order has been
 * delivered.
 *
 * The user prints via the browser's native dialog (which has "Save as PDF"
 * on every modern OS), so we don't need a server-side PDF library — and
 * we don't have to store any artifact. Print CSS strips the surrounding
 * page chrome so the printed page is just the receipt.
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/account/orders/${orderId}/receipt`)

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      ${ORDER_ITEMS_SELECT},
      address:addresses ( full_address, city, state, pincode )
    `)
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) notFound()
  if (order.status !== 'delivered') {
    // Receipt only available once the order is in the customer's hands.
    redirect(`/account/orders/${orderId}`)
  }

  const items = sortItems((order.items ?? []) as OrderItemWithProduct[])
  const address = order.address as { full_address: string; city: string; state: string; pincode: string } | null

  // Customer's auth email + profile, for proof-of-purchase.
  const admin = getSupabaseAdminClient()
  const [
    { data: authUser },
    { data: profile },
  ] = await Promise.all([
    admin.auth.admin.getUserById(user.id),
    admin.from('users').select('full_name, phone').eq('id', user.id).maybeSingle(),
  ])

  const totalRupees = items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0)

  return (
    <ReceiptView
      brandName={siteConfig.name}
      orderId={order.id}
      orderShortId={order.id.slice(0, 8).toUpperCase()}
      orderedAt={order.created_at as string}
      paymentId={(order.razorpay_payment_id as string | null) ?? null}
      customerName={profile?.full_name ?? null}
      customerEmail={authUser?.user?.email ?? null}
      customerPhone={profile?.phone ?? null}
      address={address}
      lines={items.map((item) => ({
        productName: item.product?.name ?? 'Item',
        variantLabel: item.variant_label,
        unitPrice: item.unit_price,
        quantity: item.quantity,
      }))}
      totalRupees={totalRupees}
    />
  )
}
