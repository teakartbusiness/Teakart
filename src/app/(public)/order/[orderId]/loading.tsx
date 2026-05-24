import { Skeleton } from '@/components/ui/skeleton'

export default function OrderConfirmationLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="mt-4 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Skeleton className="mx-auto aspect-square w-full max-w-md" />
        <div className="space-y-4 p-6 sm:p-8">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
