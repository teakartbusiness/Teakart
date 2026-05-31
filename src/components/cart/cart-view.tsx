'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useShopStore } from '@/lib/shop-store'
import type { HydratedCartLine } from '@/lib/shop-store'

export default function CartView() {
  const { cart, loading, setQuantity, removeFromCart, moveCartToWishlist } = useShopStore()

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-foreground">Your cart is empty.</p>
        <p className="mt-1 text-sm text-muted-foreground">Browse products and add a few you love.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  const hasUnavailable = cart.items.some((it) => !it.available || !it.product)

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {cart.items.map((line) => (
          <CartRow
            key={`${line.product_id}::${line.variant_label ?? ''}`}
            line={line}
            onChangeQty={(q) => setQuantity(line.product_id, line.variant_label, q)}
            onRemove={() => removeFromCart(line.product_id, line.variant_label)}
            onMoveToWishlist={() => moveCartToWishlist(line.product_id, line.variant_label)}
          />
        ))}
      </ul>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            ₹{cart.subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Shipping is arranged manually over WhatsApp after checkout.
        </p>
        {hasUnavailable && (
          <p className="mt-3 text-xs text-warning-foreground">
            Remove unavailable items before checking out.
          </p>
        )}
        <Link
          href="/checkout?source=cart"
          aria-disabled={hasUnavailable}
          className={
            hasUnavailable
              ? 'mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary/50 px-5 py-3 text-sm font-medium text-primary-foreground pointer-events-none'
              : 'mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
          }
        >
          Continue to checkout
        </Link>
      </section>
    </div>
  )
}

function CartRow({
  line,
  onChangeQty,
  onRemove,
  onMoveToWishlist,
}: {
  line: HydratedCartLine
  onChangeQty: (next: number) => Promise<void>
  onRemove: () => Promise<void>
  onMoveToWishlist: () => Promise<void>
}) {
  const [pending, setPending] = useState(false)
  const product = line.product
  const heroImages = product?.images ?? []
  const heroImage = [...heroImages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]

  const productHref = product?.slug && product.category_slug
    ? `/products/${product.category_slug}/${product.slug}`
    : '/products'

  async function bump(delta: number) {
    if (pending) return
    setPending(true)
    try {
      await onChangeQty(line.quantity + delta)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (pending) return
    setPending(true)
    try {
      await onRemove()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  async function moveToWishlist() {
    if (pending) return
    setPending(true)
    try {
      await onMoveToWishlist()
      toast.success('Moved to wishlist')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  if (!product) {
    return (
      <li className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
        <p className="text-sm text-muted-foreground">Item no longer available.</p>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Remove
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <Link
        href={productHref}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24"
      >
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80px, 96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={productHref}
          className="truncate text-sm font-medium text-foreground hover:underline sm:text-base"
        >
          {product.name}
        </Link>
        {line.variant_label && (
          <p className="text-xs text-muted-foreground">{line.variant_label}</p>
        )}
        <p className="text-xs tabular-nums text-muted-foreground">
          ₹{line.unit_price.toLocaleString('en-IN')} each
        </p>
        {!line.available && (
          <p className="text-xs text-warning-foreground">Unavailable right now</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="inline-flex items-center rounded-lg border border-border bg-background">
          <button
            type="button"
            onClick={() => bump(-1)}
            disabled={pending || line.quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex size-8 items-center justify-center text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-[2rem] text-center text-sm tabular-nums">{line.quantity}</span>
          <button
            type="button"
            onClick={() => bump(1)}
            disabled={pending}
            aria-label="Increase quantity"
            className="inline-flex size-8 items-center justify-center text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          ₹{line.line_total.toLocaleString('en-IN')}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={moveToWishlist}
            disabled={pending}
            className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            Move to wishlist
          </button>
          <span className="text-xs text-border">|</span>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Remove from cart"
            className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="inline size-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}
