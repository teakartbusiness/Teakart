'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Addresses', href: '/account/addresses' },
  { label: 'Settings', href: '/account/settings' },
]

export default function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-10 flex gap-8 border-b border-border print:hidden">
      {NAV_LINKS.map(({ label, href }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97]',
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
