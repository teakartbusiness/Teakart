import { Skeleton } from '@/components/ui/skeleton'

export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="text-center">
        <Skeleton className="mx-auto h-9 w-40" />
        <Skeleton className="mx-auto mt-2 h-4 w-80" />
      </div>
      <div className="mt-10 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-3 w-32" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="mt-3 h-5 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </main>
  )
}
