import { OrderStatusHistory, OrderStatus } from '@/types'

const STATUS_DOT: Record<OrderStatus, string> = {
  pending:   'bg-status-pending-fg',
  confirmed: 'bg-status-confirmed-fg',
  shipped:   'bg-status-shipped-fg',
  delivered: 'bg-status-delivered-fg',
  cancelled: 'bg-status-cancelled-fg',
}

export default function OrderStatusTimeline({ history }: { history: OrderStatusHistory[] }) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <ol className="relative border-l border-border ml-2">
      {sorted.map((entry, index) => (
        <li key={entry.id} className={`ml-5 ${index !== sorted.length - 1 ? 'mb-6' : ''}`}>
          <span
            className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background ${STATUS_DOT[entry.status]}`}
          />
          <p className="text-sm font-semibold capitalize">{entry.status}</p>
          {entry.note && (
            <p className="text-sm text-muted-foreground mt-0.5">{entry.note}</p>
          )}
          <time className="text-xs text-muted-foreground">
            {new Date(entry.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </li>
      ))}
    </ol>
  )
}
