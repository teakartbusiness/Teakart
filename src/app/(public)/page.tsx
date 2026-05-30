import { getSupabasePublicClient } from '@/lib/supabase/public'
import { loadProductRatings } from '@/lib/reviews'
import DiscoverHome from '@/components/home/discover-home'
import { selectHero, type HomeSection } from '@/components/home/home-types'
import type { Category, Product } from '@/types'

import { siteConfig } from '@/lib/site-config'

// Static at build, re-generated at most every 5 minutes after a request.
// Bust earlier via revalidatePath calls in /api/products mutations.
export const revalidate = 300

export const metadata = {
  title: { absolute: `${siteConfig.name} — Thoughtfully curated goods` },
  description:
    'A small, curated shop. Carefully chosen pieces, direct from the maker, shipped across India.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${siteConfig.name} — Thoughtfully curated goods`,
    description:
      'A small, curated shop. Carefully chosen pieces, direct from the maker, shipped across India.',
    url: '/',
  },
}

// Each homepage category section shows its top-selling products, capped here.
const MAX_PER_CATEGORY = 5
const NEW_ARRIVALS_COUNT = 8

export default async function HomePage() {
  const supabase = getSupabasePublicClient()

  // Two queries: all products (grouped + sorted by sales per category below),
  // and the recent "New arrivals" strip up top. Reading twice is fine — cached.
  const [productsRes, recentRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_deleted', false)
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(NEW_ARRIVALS_COUNT),
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ])

  const allProducts = (productsRes.data ?? []) as Product[]
  const newArrivals = (recentRes.data ?? []) as Product[]
  const categories = (categoriesRes.data ?? []) as Category[]

  // Group products by category, sorted by sales (most purchased first), tiebreak
  // by name. The top seller (sales > 0) of each section gets the "Best seller" badge.
  const productsByCategory = new Map<string, Product[]>()
  for (const p of allProducts) {
    if (!p.category_id) continue
    const bucket = productsByCategory.get(p.category_id) ?? []
    bucket.push(p)
    productsByCategory.set(p.category_id, bucket)
  }
  for (const bucket of productsByCategory.values()) {
    bucket.sort(
      (a, b) =>
        (b.sales_count ?? 0) - (a.sales_count ?? 0) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    )
  }

  const sections: HomeSection[] = categories
    .filter((c) => (productsByCategory.get(c.id)?.length ?? 0) > 0)
    .map((category) => {
      const bucket = productsByCategory.get(category.id) ?? []
      return {
        category,
        products: bucket.slice(0, MAX_PER_CATEGORY),
        total: bucket.length,
        bestSellerId: bucket[0] && (bucket[0].sales_count ?? 0) > 0 ? bucket[0].id : null,
      }
    })

  // Hero spotlight (best-seller) + square mosaic (seller's-choice-preferred,
  // random) — computed in a plain helper so the randomness stays out of the
  // component's render-purity scope. Frozen per ISR window (every 5 min).
  const { spotlight, mosaic } = selectHero(allProducts)

  // Ratings for every product shown on the page (per-category top-N + new arrivals).
  const shownIds = new Set<string>(newArrivals.map((p) => p.id))
  for (const s of sections) {
    for (const p of s.products) shownIds.add(p.id)
  }
  const ratings = await loadProductRatings(Array.from(shownIds))

  return (
    <DiscoverHome
      newArrivals={newArrivals}
      sections={sections}
      ratings={ratings}
      spotlight={spotlight}
      mosaic={mosaic}
    />
  )
}
