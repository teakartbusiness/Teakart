'use client'

import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { useShopStore } from '@/lib/shop-store'

/**
 * Heart + cart icons with count badges. Sits in the desktop header (next to
 * the theme toggle) and inside the mobile drawer. Pulls counts from the
 * shared ShopStoreProvider — signed-out users see zeros silently.
 */
export default function NavShopIcons({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { cartCount, wishlistCount } = useShopStore()

  if (variant === 'row') {
    return (
      <>
        <Link
          href="/account/wishlist"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <span>Wishlist</span>
          <span className="inline-flex items-center gap-2">
            {wishlistCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                {wishlistCount}
              </span>
            )}
            <Heart className="size-4" />
          </span>
        </Link>
        <Link
          href="/cart"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <span>Cart</span>
          <span className="inline-flex items-center gap-2">
            {cartCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                {cartCount}
              </span>
            )}
            <ShoppingBag className="size-4" />
          </span>
        </Link>
      </>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account/wishlist"
        aria-label={`Wishlist (${wishlistCount} items)`}
        title="Wishlist"
        className="relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        <Heart className="size-5" />
        {wishlistCount > 0 && <Badge count={wishlistCount} />}
      </Link>
      <Link
        href="/cart"
        aria-label={`Cart (${cartCount} items)`}
        title="Cart"
        className="relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        <ShoppingBag className="size-5" />
        {cartCount > 0 && <Badge count={cartCount} />}
      </Link>
    </div>
  )
}

function Badge({ count }: { count: number }) {
  const display = count > 99 ? '99+' : String(count)
  return (
    <span
      aria-hidden
      className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-[1.1rem] text-primary-foreground ring-2 ring-background"
    >
      {display}
    </span>
  )
}
