import type { OrderStatus } from '@/types'

/**
 * Linear state progression — used by the UI to constrain the dropdown
 * to "current + the immediate next step" and by the server to reject any
 * non-adjacent transition.
 */

const ORDER_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
}

export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  const next = ORDER_NEXT[current]
  return next ? [current, next] : [current]
}

export function isAllowedOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true
  return ORDER_NEXT[from] === to
}
