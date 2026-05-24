import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import OrdersBoard from '@/components/admin/orders-board'
import { ORDER_ITEMS_SELECT, type OrderItemWithProduct } from '@/lib/orders'
import type { Order } from '@/types'

export const dynamic = 'force-dynamic'

type OrderRow = Order & {
  items?: OrderItemWithProduct[]
  user: { full_name: string | null } | null
}

export default async function AdminOrdersPage() {
  await guardPage('orders.view')
  const supabase = getSupabaseAdminClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      ${ORDER_ITEMS_SELECT},
      user:users ( full_name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive-soft border border-destructive/30 text-sm text-destructive">
        Failed to load orders: {error.message}
      </div>
    )
  }

  const list = (orders ?? []) as OrderRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{list.length} total</p>
      </div>

      <OrdersBoard initial={list} />
    </div>
  )
}
