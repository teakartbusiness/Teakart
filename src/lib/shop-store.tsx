'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CartLine, Product, WishlistEntry } from '@/types'

/* -----------------------------------------------------------------------------
 *  Cart + Wishlist client store.
 *
 *  Server is the source of truth (users.cart + users.wishlist JSONB). The store
 *  fetches on mount, mirrors locally, and writes back on every mutation. We use
 *  optimistic updates so the badge in the navbar reacts instantly.
 *
 *  Signed-out users see empty counts — the GET endpoints return an empty 200
 *  for guests (no console noise), so the provider just trusts the server.
 * ---------------------------------------------------------------------------*/

export type HydratedCartLine = CartLine & {
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'variants'> & {
    category_slug: string | null
  } | null
  unit_price: number
  line_total: number
  available: boolean
}

export type HydratedWishlistEntry = WishlistEntry & {
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'variants'> & {
    category_slug: string | null
    in_stock: boolean
  } | null
}

type CartState = { items: HydratedCartLine[]; subtotal: number }
type WishlistState = { items: HydratedWishlistEntry[] }

interface ShopContextValue {
  cart: CartState
  wishlist: WishlistState
  loading: boolean
  cartCount: number
  wishlistCount: number
  refresh: () => Promise<void>
  setCartLines: (items: CartLine[]) => Promise<CartState>
  addToCart: (productId: string, variantLabel: string | null, quantity?: number) => Promise<void>
  setQuantity: (productId: string, variantLabel: string | null, quantity: number) => Promise<void>
  removeFromCart: (productId: string, variantLabel: string | null) => Promise<void>
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<boolean>
}

const ShopContext = createContext<ShopContextValue | null>(null)

const EMPTY_CART: CartState = { items: [], subtotal: 0 }
const EMPTY_WISHLIST: WishlistState = { items: [] }

export function ShopStoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART)
  const [wishlist, setWishlist] = useState<WishlistState>(EMPTY_WISHLIST)
  const [loading, setLoading] = useState(true)
  const inflight = useRef<{ cart?: AbortController; wishlist?: AbortController }>({})

  const fetchCart = useCallback(async () => {
    inflight.current.cart?.abort()
    const ctrl = new AbortController()
    inflight.current.cart = ctrl
    try {
      const res = await fetch('/api/cart', { signal: ctrl.signal, cache: 'no-store' })
      if (!res.ok) {
        setCart(EMPTY_CART)
        return
      }
      const data = (await res.json()) as CartState
      setCart({ items: data.items ?? [], subtotal: data.subtotal ?? 0 })
    } catch {
      // aborted or network error — leave previous state alone
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    inflight.current.wishlist?.abort()
    const ctrl = new AbortController()
    inflight.current.wishlist = ctrl
    try {
      const res = await fetch('/api/wishlist', { signal: ctrl.signal, cache: 'no-store' })
      if (!res.ok) {
        setWishlist(EMPTY_WISHLIST)
        return
      }
      const data = (await res.json()) as WishlistState
      setWishlist({ items: data.items ?? [] })
    } catch {
      // aborted or network error — leave previous state alone
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchCart(), fetchWishlist()])
    setLoading(false)
  }, [fetchCart, fetchWishlist])

  useEffect(() => {
    // Initial load shows skeletons (loading stays true until the first fetch resolves).
    refresh()
    // Re-sync when the window regains focus so two tabs stay consistent — but
    // SILENTLY (never flip `loading`). Otherwise every tab switch back to the app
    // would flash the cart/wishlist skeletons as if the page had reloaded.
    function onFocus() {
      Promise.all([fetchCart(), fetchWishlist()])
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh, fetchCart, fetchWishlist])

  const setCartLines = useCallback(async (items: CartLine[]): Promise<CartState> => {
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error ?? 'Could not update cart')
    }
    const next = (await res.json()) as CartState
    setCart({ items: next.items ?? [], subtotal: next.subtotal ?? 0 })
    return next
  }, [])

  const addToCart = useCallback(
    async (productId: string, variantLabel: string | null, quantity = 1) => {
      const current = cart.items.map((it) => ({
        product_id: it.product_id,
        variant_label: it.variant_label,
        quantity: it.quantity,
      })) as CartLine[]
      const key = (p: string, v: string | null) => `${p}::${v ?? ''}`
      const idx = current.findIndex((l) => key(l.product_id, l.variant_label) === key(productId, variantLabel))
      if (idx >= 0) {
        current[idx] = { ...current[idx], quantity: current[idx].quantity + quantity }
      } else {
        current.push({ product_id: productId, variant_label: variantLabel, quantity })
      }
      await setCartLines(current)
    },
    [cart.items, setCartLines],
  )

  const setQuantity = useCallback(
    async (productId: string, variantLabel: string | null, quantity: number) => {
      const next = cart.items
        .map((it) => ({
          product_id: it.product_id,
          variant_label: it.variant_label,
          quantity:
            it.product_id === productId && (it.variant_label ?? null) === (variantLabel ?? null)
              ? quantity
              : it.quantity,
        }))
        .filter((it) => it.quantity > 0)
      await setCartLines(next as CartLine[])
    },
    [cart.items, setCartLines],
  )

  const removeFromCart = useCallback(
    async (productId: string, variantLabel: string | null) => {
      const next = cart.items
        .filter(
          (it) =>
            !(
              it.product_id === productId &&
              (it.variant_label ?? null) === (variantLabel ?? null)
            ),
        )
        .map((it) => ({ product_id: it.product_id, variant_label: it.variant_label, quantity: it.quantity }))
      await setCartLines(next as CartLine[])
    },
    [cart.items, setCartLines],
  )

  const isInWishlist = useCallback(
    (productId: string) => wishlist.items.some((e) => e.product_id === productId),
    [wishlist.items],
  )

  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const already = wishlist.items.some((e) => e.product_id === productId)
      const next = already
        ? wishlist.items.filter((e) => e.product_id !== productId).map((e) => ({ product_id: e.product_id }))
        : [...wishlist.items.map((e) => ({ product_id: e.product_id })), { product_id: productId }]
      const res = await fetch('/api/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Could not update wishlist')
      }
      const updated = (await res.json()) as WishlistState
      setWishlist({ items: updated.items ?? [] })
      return !already
    },
    [wishlist.items],
  )

  const cartCount = useMemo(
    () => cart.items.filter((it) => it.available).reduce((acc, it) => acc + it.quantity, 0),
    [cart.items],
  )
  const wishlistCount = wishlist.items.length

  const value = useMemo<ShopContextValue>(
    () => ({
      cart,
      wishlist,
      loading,
      cartCount,
      wishlistCount,
      refresh,
      setCartLines,
      addToCart,
      setQuantity,
      removeFromCart,
      isInWishlist,
      toggleWishlist,
    }),
    [
      cart,
      wishlist,
      loading,
      cartCount,
      wishlistCount,
      refresh,
      setCartLines,
      addToCart,
      setQuantity,
      removeFromCart,
      isInWishlist,
      toggleWishlist,
    ],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShopStore(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShopStore must be used inside ShopStoreProvider')
  }
  return ctx
}
