'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DropdownMenu } from 'radix-ui'
import { Bell, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

/**
 * Storefront header notification bell — the in-site customer feed.
 *
 * Self-contained auth: renders nothing for signed-out visitors. Fetches the
 * feed on sign-in and whenever the panel opens (no realtime needed at this
 * scale). Each item links to its `href` and is marked read on click; a
 * "Mark all read" action clears the unread badge in one call.
 */

type FeedItem = Pick<Notification, 'id' | 'type' | 'title' | 'body' | 'href' | 'read_at' | 'created_at'>

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<FeedItem[]>([])
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { notifications: FeedItem[]; unread: number }
      setItems(data.notifications ?? [])
      setUnread(data.unread ?? 0)
    } catch {
      /* best-effort — leave the current feed in place */
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) refresh()
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) refresh()
      else {
        setItems([])
        setUnread(0)
      }
    })
    return () => subscription.unsubscribe()
  }, [refresh])

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    setUnread((u) => Math.max(0, u - 1))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      /* optimistic — refetch will reconcile next open */
    }
  }

  async function markAllRead() {
    if (unread === 0) return
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
    setUnread(0)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch {
      /* optimistic */
    }
  }

  async function remove(id: string) {
    const target = items.find((n) => n.id === id)
    setItems((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.read_at) setUnread((u) => Math.max(0, u - 1))
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      /* optimistic — refetch will reconcile next open */
    }
  }

  async function clearRead() {
    if (!items.some((n) => n.read_at)) return
    setItems((prev) => prev.filter((n) => !n.read_at))
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readOnly: true }),
      })
    } catch {
      /* optimistic */
    }
  }

  // Signed-out visitors get no bell.
  if (!user) return null

  const hasRead = items.some((n) => n.read_at)

  return (
    <DropdownMenu.Root onOpenChange={(open) => open && refresh()}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          title="Notifications"
          className="relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-[1.1rem] text-primary-foreground ring-2 ring-background"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Mark all read
                </button>
              )}
              {hasRead && (
                <button
                  type="button"
                  onClick={clearRead}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Clear read
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="group relative">
                  <DropdownMenu.Item asChild>
                    <Link
                      href={n.href}
                      onClick={() => {
                        if (!n.read_at) markRead(n.id)
                      }}
                      className="flex cursor-pointer select-none gap-3 px-4 py-3 pr-10 outline-none transition-colors hover:bg-muted focus:bg-muted"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-primary'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${n.read_at ? 'text-foreground' : 'font-semibold text-foreground'}`}>
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-text-subtle">{timeAgo(n.created_at)}</span>
                      </span>
                    </Link>
                  </DropdownMenu.Item>
                  {/* Delete — a sibling of the menu item (not inside the Link), so
                      clicking it removes the row without navigating or closing. */}
                  <button
                    type="button"
                    aria-label="Delete notification"
                    title="Delete"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      remove(n.id)
                    }}
                    className="absolute right-2 top-2.5 z-10 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
