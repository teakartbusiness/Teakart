import { Skeleton } from '@/components/ui/skeleton'

export default function ReceiptLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-10 w-40 rounded-lg" />
      </div>
    </div>
  )
}
