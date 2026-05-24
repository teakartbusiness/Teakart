import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </section>
      <section>
        <Skeleton className="h-3 w-32" />
        <div className="mt-3 rounded-lg border border-border bg-card">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
