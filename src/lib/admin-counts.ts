import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export interface AdminPendingCounts {
  orders: number          // orders awaiting confirmation
}

const ZERO: AdminPendingCounts = { orders: 0 }

/**
 * Bulk-load the small badge counts the admin sidebar shows next to each
 * navigable section. Designed to be called once per admin page render.
 *
 * Each query is a HEAD count with a precise filter so we never download
 * row bodies. Failures (e.g. table missing during pre-migration window)
 * fall back to 0 so the sidebar still renders.
 */
export async function loadAdminPendingCounts(): Promise<AdminPendingCounts> {
  try {
    const admin = getSupabaseAdminClient()

    const ordersRes = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      orders: ordersRes.count ?? 0,
    }
  } catch {
    return ZERO
  }
}
