import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors the product detail two-column layout: gallery + thumbnails on
 * the left, eyebrow/title/buy card/description on the right.
 */
export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
        {/* Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Title + buy card + details */}
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-3/4 sm:h-14" />
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-9 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-2">
                <Skeleton className="h-11 w-24 rounded-xl" />
                <Skeleton className="h-11 w-24 rounded-xl" />
                <Skeleton className="h-11 w-24 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </div>
    </main>
  )
}
