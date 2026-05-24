import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors customer order detail: hero card (split image + details), then
 * address / receipt / cancellation / status-history cards stacked below.
 */
export default function OrderDetailLoading() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-square w-full" />
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </section>

      {Array.from({ length: 3 }).map((_, i) => (
        <section
          key={i}
          className="rounded-2xl border border-border bg-card p-6 space-y-3"
        >
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </section>
      ))}
    </div>
  )
}
