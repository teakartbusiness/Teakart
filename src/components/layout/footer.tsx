import Link from 'next/link'
import Logo from './logo'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Link
              href="/"
              aria-label="TeaKart — home"
              className="inline-flex items-center transition-opacity hover:opacity-85"
            >
              <Logo className="h-10 w-auto" />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A small, curated shop. Carefully chosen goods, shipped across India.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shop
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-foreground transition-colors hover:text-muted-foreground">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="text-foreground transition-colors hover:text-muted-foreground">
                  My orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Support
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li className="text-muted-foreground">
                Order updates over WhatsApp
              </li>
              <li className="text-muted-foreground">
                Manual shipping &amp; refunds
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TeaKart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
