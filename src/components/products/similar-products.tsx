import { getSupabasePublicClient } from '@/lib/supabase/public'
import { loadProductRatings } from '@/lib/reviews'
import ProductCard from './product-card'
import type { Product } from '@/types'

interface Props {
  categoryId: string
  /** Id of the product currently on screen — excluded from results. */
  excludeProductId: string
}

/**
 * "Similar products" section for the product detail page. Pulls other active
 * products in the same category, excluding the current one. Bulk-loads
 * ratings the same way the listing pages do so each card shows its stars.
 *
 * Renders nothing when there are no siblings — empty section would be noise.
 */
export default async function SimilarProducts({ categoryId, excludeProductId }: Props) {
  const supabase = getSupabasePublicClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('category_id', categoryId)
    .eq('is_deleted', false)
    .neq('id', excludeProductId)
    .order('name', { ascending: true })
    .limit(12)

  if (error || !data || data.length === 0) return null

  const products = data as Product[]
  const ratingMap = await loadProductRatings(products.map((p) => p.id))

  return (
    <section className="mt-16">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Similar products
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        More from the same category.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            rating={ratingMap.get(product.id)}
          />
        ))}
      </div>
    </section>
  )
}
