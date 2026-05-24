import { Skeleton } from '@/components/ui/skeleton'

export default function AdminProductEditLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-7 w-1/2" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
