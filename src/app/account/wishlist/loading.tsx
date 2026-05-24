import { Skeleton } from '@/components/ui/skeleton'

export default function WishlistLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-44" />
      <Skeleton className="mt-2 h-4 w-72" />
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="space-y-3 rounded-2xl border border-border bg-card p-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-1.5">
              <Skeleton className="h-7 flex-1 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
