import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { CartLine, Product, Variant } from '@/types'
import { normalizeWishlist, loadHydrated as loadHydratedWishlist } from '../wishlist/route'

const MAX_ITEMS = 20
const MAX_QUANTITY_PER_LINE = 99

type HydratedLine = CartLine & {
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'variants'> & {
    category_slug: string | null
  } | null
  unit_price: number
  line_total: number
  available: boolean
}

function normalizeCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return []
  const seen = new Map<string, CartLine>()
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Partial<CartLine>
    if (typeof e.product_id !== 'string' || e.product_id.length === 0) continue
    const variant = typeof e.variant_label === 'string' && e.variant_label.length > 0 ? e.variant_label : null
    const qty = typeof e.quantity === 'number' && Number.isFinite(e.quantity)
      ? Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(e.quantity)))
      : 1
    const key = `${e.product_id}::${variant ?? ''}`
    const existing = seen.get(key)
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY_PER_LINE, existing.quantity + qty)
    } else {
      seen.set(key, { product_id: e.product_id, variant_label: variant, quantity: qty })
    }
  }
  return Array.from(seen.values()).slice(0, MAX_ITEMS)
}

export async function loadHydrated(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, userId: string) {
  const { data: row } = await supabase
    .from('users')
    .select('cart')
    .eq('id', userId)
    .single()

  const stored = normalizeCart(row?.cart)
  if (stored.length === 0) return { items: [] as HydratedLine[], subtotal: 0 }

  const productIds = Array.from(new Set(stored.map((l) => l.product_id)))
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, images, variants, is_deleted, in_stock, category:categories(slug)')
    .in('id', productIds)

  const byId = new Map(
    (products ?? []).map((p) => [
      p.id as string,
      p as unknown as Product & { is_deleted: boolean; in_stock: boolean; category: { slug: string } | { slug: string }[] | null },
    ]),
  )

  let subtotal = 0
  const items: HydratedLine[] = stored.map((line) => {
    const product = byId.get(line.product_id)
    if (!product || product.is_deleted) {
      return { ...line, product: null, unit_price: 0, line_total: 0, available: false }
    }
    const variants = (product.variants ?? []) as Variant[]
    let unitPrice = product.price
    if (variants.length > 0) {
      if (!line.variant_label) {
        return { ...line, product: null, unit_price: 0, line_total: 0, available: false }
      }
      const v = variants.find((vv) => vv.label === line.variant_label)
      if (!v) return { ...line, product: null, unit_price: 0, line_total: 0, available: false }
      unitPrice = v.price
    }
    const available = product.in_stock !== false
    const total = unitPrice * line.quantity
    if (available) subtotal += total

    const cat = Array.isArray(product.category) ? product.category[0] : product.category
    return {
      ...line,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
        variants: product.variants,
        category_slug: cat?.slug ?? null,
      },
      unit_price: unitPrice,
      line_total: total,
      available,
    }
  })

  return { items, subtotal }
}

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // A signed-out visitor simply has an empty cart — return 200 (not 401) so the
  // store's mount fetch doesn't log a console error for guests.
  if (!user) {
    return NextResponse.json({ items: [], subtotal: 0 })
  }
  const hydrated = await loadHydrated(supabase, user.id)
  return NextResponse.json(hydrated)
}

/**
 * PUT — replace the entire cart. Body: { items: CartLine[], wishlist?: WishlistEntry[] }.
 * Returns the hydrated cart (+ wishlist if requested) on success.
 */
export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { items?: unknown; wishlist?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const cart = normalizeCart(body.items)
  const updatePayload: Record<string, any> = { cart }
  const hasWishlist = body.wishlist !== undefined
  if (hasWishlist) {
    updatePayload.wishlist = normalizeWishlist(body.wishlist)
  }

  const { error } = await supabase.from('users').update(updatePayload).eq('id', user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hydratedCart = await loadHydrated(supabase, user.id)
  if (hasWishlist) {
    const hydratedWishlist = await loadHydratedWishlist(supabase, user.id)
    return NextResponse.json({
      ...hydratedCart,
      wishlist: hydratedWishlist,
    })
  }

  return NextResponse.json(hydratedCart)
}
