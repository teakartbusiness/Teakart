import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type ProductRating = { average: number; count: number }

/**
 * Bulk-load average rating + count for a list of product ids. Used by the
 * product listing grid so each card can show a star strip without N+1
 * queries.
 *
 * One indexed query over product_reviews; aggregation happens in memory
 * (totals are tiny — at most a few hundred reviews per product at this
 * scale).
 */
export async function loadProductRatings(
  productIds: string[],
): Promise<Map<string, ProductRating>> {
  const out = new Map<string, ProductRating>()
  if (productIds.length === 0) return out

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('product_reviews')
      .select('product_id, rating')
      .in('product_id', productIds)
      .eq('is_hidden', false)

    if (error || !data) return out

    const tallies = new Map<string, { sum: number; count: number }>()
    for (const row of data) {
      const pid = row.product_id as string
      const r = (row.rating as number) ?? 0
      const t = tallies.get(pid) ?? { sum: 0, count: 0 }
      t.sum += r
      t.count += 1
      tallies.set(pid, t)
    }
    for (const [pid, t] of tallies) {
      if (t.count === 0) continue
      out.set(pid, {
        average: Math.round((t.sum / t.count) * 10) / 10,
        count: t.count,
      })
    }
  } catch {
    // Table missing (migration not run) or DB hiccup — return empty map.
  }

  return out
}
