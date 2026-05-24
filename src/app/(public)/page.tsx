import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/products/product-card'
import SearchBar from '@/components/products/search-bar'
import { getSupabasePublicClient } from '@/lib/supabase/public'
import { loadProductRatings } from '@/lib/reviews'
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

  const populatedCategories = categories.filter(
    (c) => (productsByCategory.get(c.id)?.length ?? 0) > 0,
  )

  // Ratings for every product shown on the page (per-category top-N + new arrivals).
  const shownIds = new Set<string>(newArrivals.map((p) => p.id))
  for (const c of populatedCategories) {
    for (const p of (productsByCategory.get(c.id) ?? []).slice(0, MAX_PER_CATEGORY)) {
      shownIds.add(p.id)
    }
  }
  const ratingMap = await loadProductRatings(Array.from(shownIds))

  return (
    <>
      {/* Hero */}
      <section className="relative isolate border-b border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              A small, curated shop
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Pieces worth keeping.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Carefully chosen goods, direct from the maker. Browse the
              collection and find something that fits.
            </p>
            <div className="mx-auto mt-10 max-w-xl">
              <SearchBar variant="hero" />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                Browse the collection
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals — recency, capped at NEW_ARRIVALS_COUNT */}
      {newArrivals.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                New arrivals
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-1 sm:gap-x-16">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Fresh in this week
                </h2>
                <Link
                  href="/products"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  View all →
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} rating={ratingMap.get(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* One section per category, alphabetical */}
      {populatedCategories.map((category) => {
        const bucket = productsByCategory.get(category.id) ?? []
        const productsInCategory = bucket.slice(0, MAX_PER_CATEGORY)
        const totalInCategory = bucket.length
        const hasMore = totalInCategory > MAX_PER_CATEGORY
        // Top seller of the section (only if it has actually sold).
        const bestSellerId = bucket[0] && (bucket[0].sales_count ?? 0) > 0 ? bucket[0].id : null

        return (
          <section
            key={category.id}
            className="border-b border-border last:border-b-0"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Category
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-1 sm:gap-x-16">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {category.name}
                  </h2>
                  <Link
                    href={`/products/${category.slug}`}
                    aria-label={`View all ${category.name}`}
                    className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {hasMore ? `See all ${totalInCategory} →` : 'View category →'}
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                {productsInCategory.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    rating={ratingMap.get(product.id)}
                    isBestSeller={product.id === bestSellerId}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
