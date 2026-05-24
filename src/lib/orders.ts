import type { OrderItem, ProductImage } from '@/types'

/**
 * Shared select fragment for fetching order line items alongside their product
 * for display. Embed inside a top-level orders select like:
 *
 *   .select(`*, ${ORDER_ITEMS_SELECT}, address:addresses(...)`)
 */
export const ORDER_ITEMS_SELECT = `items:order_items(
  id,
  order_id,
  product_id,
  variant_label,
  unit_price,
  quantity,
  created_at,
  product:products ( name, slug, images, category:categories(slug) )
)`

export type OrderItemWithProduct = OrderItem & {
  product?: {
    name: string
    slug: string | null
    images: ProductImage[] | null
    category?: { slug: string } | null
  } | null
}

/** Sort items by created_at so an order's items render in a stable order. */
export function sortItems<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/**
 * Compute display summary for an order's items.
 *   primaryName / primaryImage — first item's product (the order's "hero").
 *   extraCount — how many additional items beyond the first.
 *   totalQuantity — sum of quantities across lines.
 */
export function summarizeItems(items: OrderItemWithProduct[] | undefined | null): {
  primaryName: string
  primaryImage: ProductImage | null
  extraCount: number
  totalQuantity: number
} {
  if (!items || items.length === 0) {
    return { primaryName: 'Product unavailable', primaryImage: null, extraCount: 0, totalQuantity: 0 }
  }
  const sorted = sortItems(items)
  const first = sorted[0]
  const primaryName = first.product?.name ?? 'Product unavailable'
  const images = first.product?.images ?? []
  const primaryImage =
    [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0] ?? null
  const extraCount = sorted.length - 1
  const totalQuantity = sorted.reduce((acc, it) => acc + (it.quantity ?? 1), 0)
  return { primaryName, primaryImage, extraCount, totalQuantity }
}

/** Format a single line for display: "Product · Variant × Qty". */
export function formatLineLabel(item: OrderItemWithProduct): string {
  const name = item.product?.name ?? 'Product'
  const parts = [name]
  const v = displayVariant(item.variant_label)
  if (v) parts.push(v)
  const label = parts.join(' · ')
  return item.quantity > 1 ? `${label} × ${item.quantity}` : label
}

/**
 * Normalize a variant_label for DISPLAY. Returns the label only when it
 * represents a real choice — null / empty / the placeholder "default"
 * mean "the product has no variants", in which case we render nothing.
 */
export function displayVariant(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.toLowerCase() === 'default') return null
  return trimmed
}
