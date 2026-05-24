import { Skeleton } from '@/components/ui/skeleton'

export default function AdminOrderDetailLoading() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Skeleton className="h-4 w-20" />
        <div className="mt-1 flex items-baseline gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <Skeleton className="h-3 w-24" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}
