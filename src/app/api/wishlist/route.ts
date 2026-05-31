import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Product, WishlistEntry } from '@/types'

const MAX_ITEMS = 100

type HydratedEntry = WishlistEntry & {
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'variants'> & {
    category_slug: string | null
    in_stock: boolean
  } | null
}

export function normalizeWishlist(raw: unknown): WishlistEntry[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: WishlistEntry[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Partial<WishlistEntry>
    if (typeof e.product_id !== 'string' || e.product_id.length === 0) continue
    if (seen.has(e.product_id)) continue
    seen.add(e.product_id)
    out.push({ product_id: e.product_id })
    if (out.length >= MAX_ITEMS) break
  }
  return out
}

export async function loadHydrated(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
): Promise<{ items: HydratedEntry[] }> {
  const { data: row } = await supabase
    .from('users')
    .select('wishlist')
    .eq('id', userId)
    .single()

  const stored = normalizeWishlist(row?.wishlist)
  if (stored.length === 0) return { items: [] }

  const productIds = stored.map((e) => e.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, images, variants, is_deleted, in_stock, category:categories(slug)')
    .in('id', productIds)

  const byId = new Map((products ?? []).map((p) => [p.id as string, p]))

  const items: HydratedEntry[] = stored.map((entry) => {
    const product = byId.get(entry.product_id)
    if (!product || product.is_deleted) {
      return { ...entry, product: null }
    }
    const cat = Array.isArray(product.category) ? product.category[0] : product.category
    return {
      ...entry,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
        variants: product.variants,
        in_stock: product.in_stock !== false,
        category_slug: (cat as { slug: string } | null)?.slug ?? null,
      },
    }
  })

  return { items }
}

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Signed-out visitor → empty wishlist, 200 (not 401), so the store's mount
  // fetch doesn't log a console error for guests.
  if (!user) {
    return NextResponse.json({ items: [] })
  }
  return NextResponse.json(await loadHydrated(supabase, user.id))
}

/** PUT — replace the wishlist. Body: { items: WishlistEntry[] }. */
export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { items?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const wishlist = normalizeWishlist(body.items)
  const { error } = await supabase.from('users').update({ wishlist }).eq('id', user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(await loadHydrated(supabase, user.id))
}
