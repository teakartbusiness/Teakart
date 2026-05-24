import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors /admin/orders: heading, tabs row, search input, then the orders
 * table with status pills and inline status selects.
 */
export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="-mb-px flex gap-1 overflow-x-hidden border-b border-border pb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-md" />
          ))}
        </div>

        {/* Search */}
        <div className="pt-6 pb-1">
          <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-surface-muted px-4 py-3">
            <div className="grid grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_80px_80px_100px_100px] gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_80px_80px_100px_100px] items-center gap-4 px-4 py-3"
              >
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-14 justify-self-end" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
