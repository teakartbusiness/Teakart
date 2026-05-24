import { notFound } from 'next/navigation'
import { getSupabasePublicClient } from '@/lib/supabase/public'
import ProductGallery from '@/components/products/product-gallery'
import ProductActions from '@/components/products/product-actions'
import ProductReviews from '@/components/products/product-reviews'
import ProductRatingSummary from '@/components/products/product-rating-summary'
import SimilarProducts from '@/components/products/similar-products'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import BackButton from '@/components/layout/back-button'
import ScrollResetOnMount from '@/components/layout/scroll-reset-on-mount'
import { siteConfig } from '@/lib/site-config'
import type { AttributeEntry, Product } from '@/types'

export const revalidate = 300

/**
 * Pre-render every product detail page at build time. New products added
 * after a deploy still work — Next.js falls back to on-demand rendering
 * and ISR-caches per `revalidate`.
 */
export async function generateStaticParams() {
  const supabase = getSupabasePublicClient()
  const { data } = await supabase
    .from('products')
    .select('slug, category:categories(slug)')
    .eq('is_deleted', false)

  type Row = { slug: string; category: { slug: string } | { slug: string }[] | null }
  return ((data ?? []) as Row[])
    .map((p) => {
      const category = Array.isArray(p.category) ? p.category[0] : p.category
      if (!category?.slug || !p.slug) return null
      return { categorySlug: category.slug, productSlug: p.slug }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

/**
 * Read attributes off a product. Sorted by position; tolerates the legacy
 * object shape for any product written before the array migration.
 */
function readAttributes(attrs: unknown): { key: string; value: string }[] {
  let entries: { key: string; value: string }[] = []
  if (Array.isArray(attrs)) {
    entries = [...(attrs as AttributeEntry[])]
      .sort((a, b) => a.position - b.position)
      .map(({ key, value }) => ({ key, value: String(value ?? '') }))
  } else if (attrs && typeof attrs === 'object') {
    entries = Object.entries(attrs as Record<string, unknown>).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
  }
  return entries.filter(({ value }) => value !== '')
}

type Props = {
  params: Promise<{ categorySlug: string; productSlug: string }>
}

async function fetchProduct(categorySlug: string, productSlug: string) {
  const supabase = getSupabasePublicClient()

  const { data } = await supabase
    .from('products')
    .select('*, category:categories!inner(*)')
    .eq('slug', productSlug)
    .eq('is_deleted', false)
    .eq('categories.slug', categorySlug)
    .maybeSingle()

  return data as Product | null
}

export async function generateMetadata({ params }: Props) {
  const { categorySlug, productSlug } = await params
  const product = await fetchProduct(categorySlug, productSlug)

  if (!product) return { title: 'Product not found' }

  const heroImage = product.images?.[0]?.url
  const canonicalPath = `/products/${categorySlug}/${productSlug}`

  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} — ₹${product.price.toLocaleString('en-IN')} on ${siteConfig.name}.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'website',
      url: canonicalPath,
      title: product.name,
      description: product.description ?? undefined,
      images: heroImage
        ? [{ url: heroImage, width: 1200, height: 1200, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description ?? undefined,
      images: heroImage ? [heroImage] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { categorySlug, productSlug } = await params
  const product = await fetchProduct(categorySlug, productSlug)

  if (!product) notFound()

  // Best seller of its category? (highest units sold in the category, > 0).
  let isBestSeller = false
  if (product.category_id) {
    const { data: top } = await getSupabasePublicClient()
      .from('products')
      .select('id, sales_count')
      .eq('category_id', product.category_id)
      .eq('is_deleted', false)
      .order('sales_count', { ascending: false })
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle()
    isBestSeller = !!top && ((top.sales_count as number | null) ?? 0) > 0 && top.id === product.id
  }

  const attributes = readAttributes(product.attributes)
  const sortedImages = [...product.images].sort((a, b) => a.position - b.position)
  const canonicalUrl = `${siteConfig.url}/products/${categorySlug}/${productSlug}`

  // Variant prices, if any, form a price range; otherwise it's a single offer.
  const variantPrices = product.variants.map((v) => v.price)
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : product.price
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : product.price

  const offers =
    minPrice === maxPrice
      ? {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: canonicalUrl,
        }
      : {
          '@type': 'AggregateOffer',
          lowPrice: minPrice,
          highPrice: maxPrice,
          priceCurrency: 'INR',
          offerCount: product.variants.length,
          availability: 'https://schema.org/InStock',
          url: canonicalUrl,
        }

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: sortedImages.map((img) => img.url),
    sku: product.id,
    category: product.category?.name,
    brand: { '@type': 'Brand', name: siteConfig.name },
    offers,
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ScrollResetOnMount />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackButton className="mb-3" />
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/products' },
          ...(product.category
            ? [{ label: product.category.name, href: `/products/${categorySlug}` }]
            : []),
          { label: product.name },
        ]}
      />
      <div className="grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
        <ProductGallery images={product.images} />

        <div className="space-y-8">
          <div className="space-y-3">
            {(isBestSeller || product.is_sellers_choice) && (
              <div className="flex flex-wrap gap-2">
                {isBestSeller && (
                  <span className="rounded-2xl bg-warning px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-foreground">
                    Best seller
                  </span>
                )}
                {product.is_sellers_choice && (
                  <span className="rounded-2xl bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                    Seller&apos;s choice
                  </span>
                )}
              </div>
            )}
            {product.category && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {product.name}
            </h1>
            <ProductRatingSummary productId={product.id} reviewsAnchor="#reviews" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <ProductActions
              product={{
                id: product.id,
                price: product.price,
                variants: product.variants,
              }}
            />
          </div>

          {product.description && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Description
              </h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">
                {product.description}
              </p>
            </div>
          )}

          {attributes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Details
              </h2>
              <dl className="divide-y divide-border rounded-2xl border border-border bg-card">
                {attributes.map(({ key, value }) => (
                  <div key={key} className="flex justify-between gap-6 px-5 py-3 text-sm">
                    <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-right text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <div id="reviews" className="mt-12 scroll-mt-24">
        <ProductReviews productId={product.id} />
      </div>

      <SimilarProducts
        categoryId={product.category_id}
        excludeProductId={product.id}
      />
    </main>
  )
}
