import { Skeleton } from '@/components/ui/skeleton'

/** Heading + "Add product" CTA + table-shaped product rows. */
export default function AdminProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-surface-muted px-4 py-3">
          <div className="grid grid-cols-[64px_minmax(0,1fr)_120px_100px_80px_80px] items-center gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14 justify-self-end" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[64px_minmax(0,1fr)_120px_100px_80px_80px] items-center gap-4 px-4 py-3"
            >
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12 justify-self-end" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 justify-self-end rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
