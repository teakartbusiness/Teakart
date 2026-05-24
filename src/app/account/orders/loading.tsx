import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors /account/orders: page heading + count line, then a vertical list
 * of order rows (image + lines on the left, status pill + amount on right).
 */
export default function OrdersLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-48 sm:h-12 sm:w-56" />
        <Skeleton className="h-5 w-24" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4"
          >
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
