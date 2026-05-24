"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DropdownMenu } from "radix-ui"
import { ChevronDown, Menu, X } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import ThemeToggle from "./theme-toggle"

/**
 * Client-only header island: auth state, desktop account dropdown,
 * mobile hamburger toggle, and mobile drawer contents. The surrounding
 * <header> structure and the static "Shop" pill live in the server
 * `Header` component so the prerendered HTML doesn't have to wait on this
 * to hydrate before painting.
 *
 * Placeholders keep the dropdown slot the same width while auth state is
 * still loading, so there's no layout shift.
 */
export default function HeaderClientArea() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // True if the signed-in user can enter the admin panel (CEO or any role with
  // at least one capability). Controls the "Admin Panel" link visibility.
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    function resolveStaff(u: User | null) {
      // Single-admin store: only the env ADMIN_EMAIL ("CEO") sees the admin link.
      const ceo = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      setIsStaff(!!u && !!ceo && u.email?.toLowerCase() === ceo.toLowerCase())
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoaded(true)
      resolveStaff(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoaded(true)
      resolveStaff(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <>
      {/* Desktop auth area */}
      <div className="hidden items-center gap-2 md:flex">
        {!authLoaded ? (
          <div className="h-10 w-24 rounded-md bg-muted/40" aria-hidden />
        ) : user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="lg" className="h-10 px-3 text-base cursor-pointer">
                Account <ChevronDown className="ml-1 size-5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-xl"
              >
                {isStaff && (
                  <>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/admin"
                        className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none hover:bg-muted"
                      >
                        Admin Panel
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  </>
                )}
                <DropdownMenu.Item asChild>
                  <Link
                    href="/account/orders"
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
                  >
                    My Orders
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    href="/account/addresses"
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
                  >
                    Addresses
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    href="/account/settings"
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
                  >
                    Settings
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  onSelect={handleSignOut}
                  className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
                >
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <Button asChild size="lg" className="h-10 px-4 text-base">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        )}
      </div>

      {/* Mobile hamburger — icons crossfade + rotate to match the drawer animation. */}
      <button
        type="button"
        className="rounded-lg p-1.5 hover:bg-muted md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        <span className="relative inline-flex size-5">
          <Menu
            className={`absolute inset-0 size-5 transition-all duration-200 ease-out ${
              mobileOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            }`}
          />
          <X
            className={`absolute inset-0 size-5 transition-all duration-200 ease-out ${
              mobileOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            }`}
          />
        </span>
      </button>

      {/* Mobile drawer — always mounted so we can animate in/out via opacity + translate.
          `inert` removes it from the a11y tree and tab order when closed. */}
      <div
        inert={!mobileOpen}
        aria-hidden={!mobileOpen}
        className={`absolute left-0 right-0 top-16 z-30 origin-top border-t border-border bg-card shadow-lg transition-all duration-200 ease-out md:hidden ${
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
          <div className="flex flex-col gap-1 px-4 py-3">
            {!authLoaded ? null : user ? (
              <>
                <Link
                  href="/account/addresses"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Addresses
                </Link>
                {isStaff && (
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/cart"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Cart
                </Link>
                <ThemeToggle variant="row" />
                <Link
                  href="/account/orders"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/account/settings"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/products"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Shop
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
                >
                  Sign Out
                </button>
                <Link
                  href="/account/wishlist"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Wishlist
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/cart"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Cart
                </Link>
                <ThemeToggle variant="row" />
                <Link
                  href="/products"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/account/wishlist"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Wishlist
                </Link>
              </>
            )}
          </div>
        </div>
    </>
  )
}
