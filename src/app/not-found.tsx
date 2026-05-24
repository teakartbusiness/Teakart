import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

/**
 * Global 404 — caught at the root level so it applies to any unknown route.
 * Standalone layout (no header / footer) so the page feels focused rather
 * than dressed-up with chrome that has nowhere to go.
 *
 * Everything uses theme tokens, so the page tracks light/dark + any admin
 * theme customization without further work.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Error 404
        </p>

        <h1 className="mt-6 font-display text-[5rem] font-semibold leading-none tracking-tight text-foreground sm:text-[7rem]">
          Not found.
        </h1>

        <p className="mx-auto mt-6 max-w-sm text-base text-muted-foreground sm:text-lg">
          The page you&apos;re looking for either doesn&apos;t exist, has
          moved, or was never here to begin with.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Search className="size-4" />
            Browse the collection
          </Link>
        </div>
      </div>
    </main>
  )
}
