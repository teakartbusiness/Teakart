"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Palette,
  ShoppingCart,
  Star,
  Tag,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Logo from "./logo"
import type { AdminPendingCounts } from "@/lib/admin-counts"
import { ADMIN_SECTIONS } from "@/lib/admin-nav"

// Icons live here (client-only) keyed by href; capability/order/labels are the
// shared source of truth in lib/admin-nav.ts.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": LayoutDashboard,
  "/admin/products": Package,
  "/admin/categories": Tag,
  "/admin/orders": ShoppingCart,
  "/admin/reviews": Star,
  "/admin/customize": Palette,
}

export default function AdminSidebar({
  counts,
  capabilities,
}: {
  counts: AdminPendingCounts
  capabilities: string[]
}) {
  const pathname = usePathname()
  const capSet = new Set(capabilities)
  const visibleItems = ADMIN_SECTIONS.filter((item) => item.anyOf.some((c) => capSet.has(c)))

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-background">
      {/* Header row — matches the height of the main content's top bar so the
          two horizontal borders line up across the page. */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link
          href="/"
          aria-label="TeaKart — home"
          title="Go to storefront"
          className="inline-flex items-center transition-opacity hover:opacity-85"
        >
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map(({ label, href, exact, countKey }) => {
          const Icon = ICONS[href]
          const active = isActive(href, exact)
          const count = countKey ? counts[countKey] : 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98]",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span
                  aria-label={`${count} need${count === 1 ? 's' : ''} attention`}
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-primary-foreground text-primary"
                      : "bg-warning text-warning-foreground",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* h-16 so this row matches the customize page's sticky Save Changes
          bar exactly — borders line up across the full app width regardless
          of scroll position. Bottom-left = the navigational "go back to the
          storefront" anchor; Sign Out moved to the top-right of the shell. */}
      <div className="flex h-16 items-center border-t border-border px-3">
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Home className="size-4 shrink-0" />
          Storefront
        </Link>
      </div>
    </aside>
  )
}
