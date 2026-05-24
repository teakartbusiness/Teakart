import { notFound } from 'next/navigation'
import { getSupabasePublicClient } from '@/lib/supabase/public'
import SortableProductGrid from '@/components/products/sortable-product-grid'
import CategoryFilter from '@/components/products/category-filter'
import SearchBar from '@/components/products/search-bar'
import BackButton from '@/components/layout/back-button'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import ScrollResetOnMount from '@/components/layout/scroll-reset-on-mount'
import { loadProductRatings } from '@/lib/reviews'
import type { Category, Product } from '@/types'

export const revalidate = 300

/**
 * Pre-render every category page at build time. New categories added after
 * a deploy still work — Next.js renders them on demand and ISR-caches per
 * `revalidate`.
 */
export async function generateStaticParams() {
  const supabase = getSupabasePublicClient()
  const { data } = await supabase.from('categories').select('slug')
  return (data ?? [])
    .filter((c): c is { slug: string } => typeof c.slug === 'string' && c.slug.length > 0)
    .map((c) => ({ categorySlug: c.slug }))
}

type Props = { params: Promise<{ categorySlug: string }> }

export async function generateMetadata({ params }: Props) {
  const { categorySlug } = await params
  const supabase = getSupabasePublicClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', categorySlug)
    .single()

  if (!category?.name) return { title: 'Products' }

  const description = category.description ?? `${category.name} from the TeaKart collection.`
  const canonicalPath = `/products/${categorySlug}`

  return {
    title: category.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { title: category.name, description, url: canonicalPath },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params
  const supabase = getSupabasePublicClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', categorySlug)
    .single()

  if (!category) notFound()

  const [productsRes, allCategoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_deleted', false)
      .eq('category_id', category.id)
      .order('name', { ascending: true }),
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ])

  const products = (productsRes.data ?? []) as Product[]
  const allCategories = (allCategoriesRes.data ?? []) as Category[]

  const ratingMap = await loadProductRatings(products.map((p) => p.id))
  const ratings: Record<string, { average: number; count: number } | undefined> = {}
  for (const [pid, r] of ratingMap) ratings[pid] = r

  // Best seller of this category — the highest sales_count (only if it's sold).
  let bestSeller: Product | null = null
  for (const p of products) {
    if ((p.sales_count ?? 0) > 0 && (!bestSeller || (p.sales_count ?? 0) > (bestSeller.sales_count ?? 0))) {
      bestSeller = p
    }
  }
  const bestSellerIds = bestSeller ? new Set([bestSeller.id]) : undefined

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <ScrollResetOnMount />
      <BackButton className="mb-3" />
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/products' },
          { label: category.name },
        ]}
      />
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 text-base text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'piece' : 'pieces'} in this category.
        </p>
      </div>
      <div className="mt-6 max-w-md">
        <SearchBar variant="compact" />
      </div>
      <div className="mt-8">
        <CategoryFilter categories={allCategories} activeSlug={category.slug} />
      </div>
      <div className="mt-10">
        <SortableProductGrid products={products} ratings={ratings} bestSellerIds={bestSellerIds} />
      </div>
    </main>
  )
}
