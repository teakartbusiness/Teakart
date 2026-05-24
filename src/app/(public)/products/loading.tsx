import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shape matches /products page: page heading + count line, category filter
 * chips, then a 4-column grid of product cards.
 */
export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-10 w-64 sm:h-12 sm:w-72" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="mt-8 flex gap-2 overflow-x-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
