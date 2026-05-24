import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCustomizeLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-2/3 max-w-md" />
      </div>
      {/* Presets section */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-1 h-4 w-2/3" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/2] rounded-xl" />
          ))}
        </div>
      </section>
      {/* Side-by-side editor + preview */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <section key={i} className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-3 w-16" />
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  )
}
