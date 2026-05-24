import type { Metadata } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ORDER_ITEMS_SELECT } from '@/lib/orders'
import OrderList from '@/components/account/order-list'

export const metadata: Metadata = {
  title: 'My orders',
  robots: { index: false, follow: false },
}

export default async function OrdersPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select(`*, ${ORDER_ITEMS_SELECT}`)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const count = orders?.length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          My orders
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {count === 0
            ? "You haven't placed any orders yet."
            : `${count} order${count === 1 ? '' : 's'}`}
        </p>
      </div>
      <OrderList orders={orders ?? []} />
    </div>
  )
}
