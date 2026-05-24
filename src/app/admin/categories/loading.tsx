import { Skeleton } from '@/components/ui/skeleton'

/** Heading + "Add category" CTA + table of categories. */
export default function AdminCategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-surface-muted px-4 py-3">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_80px_140px] gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_80px_140px] items-center gap-4 px-4 py-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-8 justify-self-end" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
