import Link from "next/link"
import { Button } from "@/components/ui/button"
import HeaderClientArea from "./header-client-area"
import NavShopIcons from "./nav-shop-icons"
import ThemeToggle from "./theme-toggle"
import Logo from "./logo"

/**
 * Server component shell — renders the static parts of the header (the outer
 * <header>, the logo, the desktop "Shop" pill). Auth state, the account
 * dropdown, and the mobile drawer are mounted by `HeaderClientArea`, which
 * hydrates separately so this HTML can be served from cache.
 *
 * Layout: logo on the left, big empty middle, then the right cluster
 * (Shop + auth area on desktop, hamburger on mobile).
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm print:hidden">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="TeaKart — home"
          className="inline-flex items-center transition-opacity hover:opacity-85"
        >
          <Logo className="h-8 w-auto sm:h-10" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <div className="hidden md:flex">
            <NavShopIcons />
          </div>
          <nav className="hidden md:flex">
            <Button asChild variant="ghost" size="lg" className="h-10 px-4 text-base">
              <Link href="/products">Shop</Link>
            </Button>
          </nav>
          <HeaderClientArea />
        </div>
      </div>
    </header>
  )
}
