export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
      </div>
    </div>
  )
}
