import { Skeleton } from '@/components/ui/skeleton'

export default function AdminReviewsLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-96" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-1 h-4 w-1/2" />
            <Skeleton className="mt-3 h-7 w-16 rounded-lg" />
          </li>
        ))}
      </ul>
    </div>
  )
}
