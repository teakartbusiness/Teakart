import { Skeleton } from '@/components/ui/skeleton'

export default function CartLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4"
          >
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-32 rounded-2xl" />
    </main>
  )
}
