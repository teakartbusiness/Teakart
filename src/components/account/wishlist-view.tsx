'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useShopStore } from '@/lib/shop-store'

export default function WishlistView() {
  const { wishlist, loading, toggleWishlist, moveWishlistToCart } = useShopStore()
  const [busy, setBusy] = useState<string | null>(null)

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />
  }

  if (wishlist.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Heart className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-medium text-foreground">No items yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the heart on any product to save it for later.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  async function handleMoveToCart(productId: string, variantsLength: number) {
    setBusy(productId)
    try {
      if (variantsLength > 0) {
        // Variant-mandatory products can't be one-click-moved without a selection.
        toast.error('Open the product to choose a variant.')
        return
      }
      await moveWishlistToCart(productId, null, 1)
      toast.success('Moved to cart')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove(productId: string) {
    setBusy(productId)
    try {
      await toggleWishlist(productId)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {wishlist.items.map((entry) => {
        const product = entry.product
        const hero = product?.images
          ? [...product.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]
          : null
        const href = product?.slug && product.category_slug
          ? `/products/${product.category_slug}/${product.slug}`
          : '/products'
        const variantsLength = product?.variants?.length ?? 0
        const outOfStock = !product || product.in_stock === false

        return (
          <li
            key={entry.product_id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Link
              href={href}
              className="relative block aspect-square overflow-hidden rounded-xl bg-muted"
            >
              {hero ? (
                <Image
                  src={hero.url}
                  alt={product?.name ?? 'Product'}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Unavailable
                </div>
              )}
            </Link>

            <div className="min-h-[3rem]">
              <Link
                href={href}
                className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
              >
                {product?.name ?? 'Product unavailable'}
              </Link>
              {product && (
                <p className="mt-1 text-sm tabular-nums text-foreground">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Two equal, full-width actions stacked one after the other. */}
            <div className="mt-auto flex flex-col gap-2">
              {outOfStock ? (
                <span className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                  Out of stock
                </span>
              ) : variantsLength > 0 ? (
                <Link
                  href={href}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
                >
                  Choose variant
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMoveToCart(entry.product_id, variantsLength)}
                  disabled={busy === entry.product_id}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  Move to cart
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(entry.product_id)}
                disabled={busy === entry.product_id}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium text-foreground transition-all duration-150 ease-out hover:bg-muted active:scale-[0.98] disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
