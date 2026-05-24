import Link from 'next/link'

/**
 * Cached by the service worker on install and served when a navigation
 * request fails because the device is offline. Kept intentionally tiny and
 * dependency-free so the cached HTML is small.
 */
export const metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          You&apos;re offline
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
          Nothing to show without a connection.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Reconnect to Wi-Fi or mobile data and try again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </Link>
      </div>
    </main>
  )
}
