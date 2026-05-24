import { Skeleton } from '@/components/ui/skeleton'

export default function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8">
        <div className="flex justify-center">
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="mx-auto h-5 w-40" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
    </div>
  )
}
