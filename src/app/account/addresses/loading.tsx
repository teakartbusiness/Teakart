import { Skeleton } from '@/components/ui/skeleton'

/** Heading + a few address cards + the Add button. */
export default function AddressesLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-56 sm:h-12 sm:w-64" />
        <Skeleton className="h-5 w-2/3" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>
    </div>
  )
}
