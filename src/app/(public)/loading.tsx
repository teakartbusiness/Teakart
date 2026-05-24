import { Skeleton } from '@/components/ui/skeleton'

/**
 * Top-level skeleton for the home page (any public route falling through
 * without its own loading.tsx). Mirrors the hero + grid layout so the swap
 * is invisible.
 */
export default function PublicLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <Skeleton className="h-10 w-1/2 max-w-md" />
      <Skeleton className="mt-3 h-4 w-2/3 max-w-lg" />
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </main>
  )
}
