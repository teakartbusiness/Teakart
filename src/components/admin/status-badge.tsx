import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg ring-status-pending-ring',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-fg ring-status-confirmed-ring',
  shipped: 'bg-status-shipped-bg text-status-shipped-fg ring-status-shipped-ring',
  delivered: 'bg-status-delivered-bg text-status-delivered-fg ring-status-delivered-ring',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg ring-status-cancelled-ring',
}

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-fg',
  confirmed: 'bg-status-confirmed-fg',
  shipped: 'bg-status-shipped-fg',
  delivered: 'bg-status-delivered-fg',
  cancelled: 'bg-status-cancelled-fg',
}

/** Read-only status pill — shares tokens with StatusSelect. Status advance now
 *  happens inside the order detail dialog, so the board row just displays. */
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span aria-hidden className={cn('inline-block size-2 rounded-full', STATUS_DOT[status])} />
      {status}
    </span>
  )
}
