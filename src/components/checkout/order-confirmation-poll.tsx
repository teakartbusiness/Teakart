'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  lookupKey: string
}

const POLL_INTERVAL_MS = 1500
const TIMEOUT_MS = 30_000

export default function OrderConfirmationPoll({ lookupKey }: Props) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    const started = Date.now()

    async function poll() {
      if (cancelled) return

      try {
        const res = await fetch(
          `/api/orders/lookup?key=${encodeURIComponent(lookupKey)}`,
          { cache: 'no-store' }
        )
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { found?: boolean }
          if (data.found) {
            router.refresh()
            return
          }
        }
      } catch {
        // Ignore transient errors and try again on the next tick.
      }

      if (cancelled) return

      if (Date.now() - started > TIMEOUT_MS) {
        setTimedOut(true)
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [lookupKey, router])

  if (timedOut) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border p-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Still processing
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment was received, but we haven&apos;t finished recording the
            order yet. Check{' '}
            <Link
              href="/account/orders"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              My Orders
            </Link>{' '}
            in a moment, or refresh this page.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.refresh()}>Refresh</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-border p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Confirming your order…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment received. Just finishing up — this usually takes a few seconds.
        </p>
      </div>
    </main>
  )
}
