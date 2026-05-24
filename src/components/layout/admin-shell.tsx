"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Menu } from "lucide-react"
import AdminSidebar from "./admin-sidebar"
import BackButton from "./back-button"
import ThemeToggle from "./theme-toggle"
import Logo from "./logo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AdminPendingCounts } from "@/lib/admin-counts"

/**
 * Admin app shell — sidebar on the left, scrolling content on the right.
 *
 * Both the sidebar header and the main content's top bar are h-16 so the
 * border-b lines align across the page. The middle of the top bar shows
 * a static "Admin Dashboard" label; Sign Out lives top-right (standard
 * account-action position), while the sidebar bottom-left gets the
 * "Storefront" navigation link.
 */
export default function AdminShell({
  children,
  counts,
  capabilities,
}: {
  children: React.ReactNode
  counts: AdminPendingCounts
  capabilities: string[]
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/sign-in")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar counts={counts} capabilities={capabilities} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-primary/40 md:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <AdminSidebar counts={counts} capabilities={capabilities} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — same h-16 as the sidebar header so borders line up.
            Mobile shows hamburger + logo. Desktop shows back button. */}
        <div className="relative flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6">
          {/* Left cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-foreground hover:bg-muted md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <Link
              href="/"
              aria-label="TeaKart — home"
              className="inline-flex items-center transition-opacity hover:opacity-85 md:hidden"
            >
              <Logo className="h-8 w-auto" />
            </Link>
            <div className="hidden md:block">
              <BackButton />
            </div>
          </div>

          {/* Center: page label. Absolute-centered so it's truly midway
              regardless of how wide the left/right clusters are. Hidden on
              the smallest screens where space is tight. `font-display` so
              admins who set a serif display font get the same premium feel
              the storefront has. */}
          <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 font-display text-xl font-semibold tracking-tight text-foreground sm:inline lg:text-2xl">
            Admin Dashboard
          </span>

          {/* Right cluster — theme toggle + sign out. Sign Out moved here
              from the sidebar so account actions sit in the conventional
              top-right corner. */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* No `pb` on purpose — pages with a sticky-bottom bar (customize
              page's Save Changes row) need the form to reach the scroll
              container's bottom so the sticky stays flush against the
              viewport bottom even at the end of scroll. */}
          <main className="px-4 pt-4 md:px-6 md:pt-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
