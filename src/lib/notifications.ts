import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationType } from '@/types'

/**
 * In-site customer notifications — the storefront header bell feed.
 *
 * Every create is best-effort: a failed insert is logged and swallowed so it
 * can never break the order flow that triggered it (same contract as
 * lib/notify.ts for email + WhatsApp). Always called with the service-role
 * client from inside an API route or server action.
 *
 * (This is the TeaKart build — only order_placed + order_status are used; the
 * type union keeps the other values so the table/contract matches the master.)
 */

export type NewNotification = {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  /** In-app path the notification links to (e.g. /account/orders/<id>). */
  href: string
}

/** Insert a single notification. Never throws. */
export async function createNotification(
  admin: SupabaseClient,
  n: NewNotification,
): Promise<void> {
  try {
    const { error } = await admin.from('notifications').insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      href: n.href,
    })
    if (error) console.error('[notifications] insert failed', error)
  } catch (err) {
    console.error('[notifications] insert threw', err)
  }
}

/** Insert many notifications in one round-trip. Never throws. */
export async function createNotifications(
  admin: SupabaseClient,
  notifications: NewNotification[],
): Promise<void> {
  if (notifications.length === 0) return
  try {
    const { error } = await admin.from('notifications').insert(
      notifications.map((n) => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        href: n.href,
      })),
    )
    if (error) console.error('[notifications] bulk insert failed', error)
  } catch (err) {
    console.error('[notifications] bulk insert threw', err)
  }
}

/** Human-friendly title for an order reaching a given status. */
export function orderStatusTitle(status: string): string {
  switch (status) {
    case 'confirmed': return 'Order confirmed'
    case 'shipped':   return 'Order shipped'
    case 'delivered': return 'Order delivered'
    case 'cancelled': return 'Order cancelled'
    default:          return 'Order updated'
  }
}
