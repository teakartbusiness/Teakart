import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import OrdersBoard, { type AdminOrderRow } from '@/components/admin/orders-board'
import { ORDER_ITEMS_SELECT } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  await guardPage('orders.view')
  const supabase = getSupabaseAdminClient()

  // The board renders a full order-detail dialog from this data (no per-row
  // fetch), so we embed address + phone + status history here as well.
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      ${ORDER_ITEMS_SELECT},
      user:users ( full_name, phone ),
      address:addresses ( full_address, city, state, pincode ),
      order_status_history ( id, order_id, status, note, created_at )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive-soft border border-destructive/30 text-sm text-destructive">
        Failed to load orders: {error.message}
      </div>
    )
  }

  const list = (orders ?? []) as AdminOrderRow[]

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
