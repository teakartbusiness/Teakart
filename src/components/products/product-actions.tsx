'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Heart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import VariantSelector from './variant-selector'
import { useShopStore } from '@/lib/shop-store'
import type { Product, Variant } from '@/types'

type Props = {
  product: Pick<Product, 'id' | 'price' | 'variants'>
}

const MAX_QTY = 99

export default function ProductActions({ product }: Props) {
  const router = useRouter()
  const sorted = [...product.variants].sort((a, b) => a.position - b.position)
  const [selected, setSelected] = useState<Variant | null>(sorted[0] ?? null)
  const [isPending, setIsPending] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [togglingHeart, setTogglingHeart] = useState(false)
  // Shared quantity for both "Add to cart" and "Buy now".
  const [qty, setQty] = useState(1)

  const { cart, addToCart, isInWishlist, toggleWishlist } = useShopStore()

  const displayPrice = selected ? selected.price : product.price
  const variantLabel = selected?.label ?? null

  const effectiveQty = Math.min(Math.max(1, qty), MAX_QTY)
  const subtotal = displayPrice * effectiveQty

  function setQtySafe(next: number) {
    if (Number.isNaN(next)) return
    setQty(Math.max(1, Math.min(MAX_QTY, Math.floor(next))))
  }

  /** Units of this product+variant already in the cart. */
  const inCartQty = useMemo(() => {
    const line = cart.items.find(
      (l) =>
        l.product_id === product.id &&
        (l.variant_label ?? null) === (variantLabel ?? null),
    )
    return line?.quantity ?? 0
  }, [cart.items, product.id, variantLabel])

  const wishlisted = isInWishlist(product.id)

  function handleBuyNow() {
    if (isPending) return
    setIsPending(true)
    const params = new URLSearchParams({ productId: product.id })
    if (selected) params.set('variantLabel', selected.label)
    if (effectiveQty > 1) params.set('quantity', String(effectiveQty))
    router.push(`/checkout?${params.toString()}`)
  }

  async function handleAddToCart() {
    if (addingToCart) return
    if (product.variants.length > 0 && !selected) {
      toast.error('Choose a variant first')
      return
    }
    setAddingToCart(true)
    try {
      await addToCart(product.id, variantLabel, effectiveQty)
      toast.success(effectiveQty > 1 ? `Added ${effectiveQty} to cart` : 'Added to cart')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingToCart(false)
    }
  }

  async function handleHeart() {
    if (togglingHeart) return
    setTogglingHeart(true)
    try {
      const added = await toggleWishlist(product.id)
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setTogglingHeart(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Price + note (note sits to the right, divided by a subtle rule) */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
          ₹{displayPrice.toLocaleString('en-IN')}
        </p>
        <span className="border-l border-border pl-3 text-xs text-muted-foreground">
          per item · inclusive of taxes
        </span>
      </div>

      <VariantSelector
        variants={product.variants}
        selected={selected}
        onSelect={(v) => {
          setSelected(v)
          setQty(1)
        }}
      />

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        {/* Quantity + live subtotal */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">Quantity</span>
          <div className="inline-flex items-center rounded-lg border border-border bg-background">
            <button
              type="button"
              onClick={() => setQtySafe(effectiveQty - 1)}
              disabled={effectiveQty <= 1}
              aria-label="Decrease quantity"
              className="inline-flex size-9 items-center justify-center rounded-l-lg text-foreground hover:bg-muted disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min={1}
              max={MAX_QTY}
              value={effectiveQty}
              onChange={(e) => setQtySafe(parseInt(e.target.value, 10))}
              aria-label="Set quantity"
              className="w-12 border-x border-border bg-transparent py-1.5 text-center text-base font-medium tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQtySafe(effectiveQty + 1)}
              disabled={effectiveQty >= MAX_QTY}
              aria-label="Increase quantity"
              className="inline-flex size-9 items-center justify-center rounded-r-lg text-foreground hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {effectiveQty > 1 && (
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-base font-semibold tabular-nums text-foreground">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Buy now — primary, full width */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isPending}
          aria-busy={isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-70"
        >
          {isPending ? (
            <span
              aria-hidden
              className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
            />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          {isPending ? 'Buying…' : 'Buy now'}
        </button>

        {/* Add to cart + Wishlist — two equal buttons */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {addingToCart ? 'Adding…' : 'Add to cart'}
          </button>
          <button
            type="button"
            onClick={handleHeart}
            disabled={togglingHeart}
            aria-pressed={wishlisted}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <Heart
              className={`size-4 ${wishlisted ? 'fill-destructive text-destructive' : ''}`}
              aria-hidden
            />
            {wishlisted ? 'Wishlisted' : 'Wishlist'}
          </button>
        </div>

        {inCartQty > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {inCartQty} already in your cart
          </p>
        )}
      </div>
    </div>
  )
}
