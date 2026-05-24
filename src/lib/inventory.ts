import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Increment products.sales_count for each ordered line (units sold). Aggregated
 * per product so a multi-variant order bumps the product once. Best-effort —
 * a failed counter update never affects the order. Powers best-seller badges +
 * the best-selling sort.
 */
export async function recordSales(
  admin: SupabaseClient,
  lines: { productId: string; quantity: number }[],
): Promise<void> {
  const byProduct = new Map<string, number>()
  for (const l of lines) {
    if (!l.productId || !(l.quantity > 0)) continue
    byProduct.set(l.productId, (byProduct.get(l.productId) ?? 0) + Math.floor(l.quantity))
  }
  await Promise.all(
    Array.from(byProduct.entries()).map(([productId, qty]) =>
      admin
        .rpc('increment_product_sales', { p_product_id: productId, p_qty: qty })
        .then(({ error }: { error: unknown }) => {
          if (error) console.error('[inventory] increment_product_sales failed', error)
        }),
    ),
  )
}
