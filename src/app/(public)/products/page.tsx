import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabasePublicClient } from '@/lib/supabase/public'
import SortableProductGrid from '@/components/products/sortable-product-grid'
import CategoryCard from '@/components/products/category-card'
import SearchBar from '@/components/products/search-bar'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import BackButton from '@/components/layout/back-button'
import ScrollResetOnMount from '@/components/layout/scroll-reset-on-mount'
import { loadProductRatings } from '@/lib/reviews'
import type { Category, Product, ProductImage } from '@/types'

export const metadata = {
  title: 'Shop',
  description: 'Browse the TeaKart collection by category, or search for a product.',
  alternates: { canonical: '/products' },
}

type Props = { searchParams: Promise<{ q?: string }> }

function heroUrl(images: ProductImage[] | undefined): string | null {
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => a.position - b.position)
  return sorted[0]?.url ?? null
}

export default async function ProductsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const supabase = getSupabasePublicClient()

  // ---- Search results ----------------------------------------------------
  if (query) {
    // Strip characters that would break the PostgREST or() filter, then match
    // name OR description.
    const safe = query.replace(/[%,()\\*]/g, ' ').trim()
    const { data, error } = safe
      ? await supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_deleted', false)
          .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
          .order('name', { ascending: true })
      : { data: [] as Product[], error: null }

    const results = (data ?? []) as Product[]
    const ratingMap = await loadProductRatings(results.map((p) => p.id))
    const ratings: Record<string, { average: number; count: number } | undefined> = {}
    for (const [pid, r] of ratingMap) ratings[pid] = r

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <ScrollResetOnMount />
        <BackButton className="mb-3" />
        <Breadcrumbs
          className="mb-6"
          items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/products' }, { label: 'Search' }]}
        />
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Search
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Results for “{query}”
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {error
              ? 'Could not run the search. Please try again.'
              : `${results.length} ${results.length === 1 ? 'match' : 'matches'}.`}
          </p>
          <Link
            href="/products"
            className="mt-3 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            ← Browse all categories
          </Link>
          <div className="mt-5 max-w-md">
            <SearchBar variant="compact" initialQuery={query} />
          </div>
        </div>
        {results.length > 0 && (
          <div className="mt-10">
            <SortableProductGrid products={results} ratings={ratings} />
          </div>
        )}
      </main>
    )
  }

  // ---- Category landing --------------------------------------------------
  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase
      .from('products')
      .select('id, category_id, images')
      .eq('is_deleted', false)
      .order('name', { ascending: true }),
  ])

  const categories = (categoriesRes.data ?? []) as Category[]
  type CoverRow = { id: string; category_id: string; images: ProductImage[] }
  const products = (productsRes.data ?? []) as unknown as CoverRow[]

  const byCategory = new Map<string, CoverRow[]>()
  for (const p of products) {
    if (!p.category_id) continue
    const bucket = byCategory.get(p.category_id) ?? []
    bucket.push(p)
    byCategory.set(p.category_id, bucket)
  }

  const populated = categories.filter((c) => (byCategory.get(c.id)?.length ?? 0) > 0)

  // Single category → skip the one-card landing; go straight to its products.
  if (populated.length === 1) {
    redirect(`/products/${populated[0].slug}`)
  }

  if (populated.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <ScrollResetOnMount />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Shop
        </h1>
        <p className="mt-6 text-muted-foreground">No products are available yet.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <ScrollResetOnMount />
      <BackButton className="mb-3" />
      <Breadcrumbs
        className="mb-6"
        items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
      />
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Shop by category
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Explore the collection — pick a category to see everything in it.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {populated.map((category) => {
          const bucket = byCategory.get(category.id) ?? []
          const coverProduct =
            (category.cover_product_id
              ? bucket.find((p) => p.id === category.cover_product_id)
              : null) ??
            bucket.find((p) => heroUrl(p.images)) ??
            bucket[0]
          return (
            <CategoryCard
              key={category.id}
              category={category}
              coverUrl={heroUrl(coverProduct?.images)}
              productCount={bucket.length}
            />
          )
        })}
      </div>
    </main>
  )
}
