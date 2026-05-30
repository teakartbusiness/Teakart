import type { Category, Product } from '@/types'

export type HomeRating = { average: number; count: number }

export type HomeSection = {
  category: Category
  /** Top-N products for this category (already sliced + sorted by sales). */
  products: Product[]
  /** Total products in the category (for the "See all N" link). */
  total: number
  /** Best-selling product id in this category (sales > 0), if any. */
  bestSellerId: string | null
}

export type HomeData = {
  newArrivals: Product[]
  sections: HomeSection[]
  ratings: Map<string, HomeRating>
  /** Overall best-seller (by sales) for the spotlight band; null if nothing sold. */
  spotlight: Product | null
  /** Up to 4 square hero images — seller's-choice-preferred, random-filled. */
  mosaic: Product[]
}

/** Product detail URL, mirroring ProductCard's own link logic. */
export function productHref(p: Product): string {
  return p.category ? `/products/${p.category.slug}/${p.slug}` : `/products/${p.slug}`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick the Discover hero's spotlight + mosaic from the full product list.
 *   - spotlight: overall best-seller (by sales_count), with an image; null if
 *     nothing has sold.
 *   - mosaic: up to 4 square hero images, seller's-choice-preferred then
 *     random-filled, distinct from the spotlight (falls back to including it
 *     only when excluding would leave nothing — tiny single-product catalogs).
 * Math.random lives here (a plain module fn, not a component) so it stays out
 * of React's render-purity scope; with ISR it's frozen per revalidation window.
 */
export function selectHero(allProducts: Product[]): {
  spotlight: Product | null
  mosaic: Product[]
} {
  const withImage = allProducts.filter((p) => p.images?.[0]?.url)

  const spotlight =
    withImage
      .filter((p) => (p.sales_count ?? 0) > 0)
      .sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0))[0] ?? null

  const sellersChoice = withImage.filter((p) => p.is_sellers_choice)
  const others = withImage.filter((p) => !p.is_sellers_choice)
  const pool = [...shuffle(sellersChoice), ...shuffle(others)]
  const exclSpotlight = pool.filter((p) => p.id !== spotlight?.id)
  const mosaic = (exclSpotlight.length > 0 ? exclSpotlight : pool).slice(0, 4)

  return { spotlight, mosaic }
}
