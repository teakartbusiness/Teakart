import type { MetadataRoute } from 'next'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

/**
 * Lists every public, indexable URL on the storefront. Generated dynamically
 * from the products/categories tables so newly-added items appear without a
 * deploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`,         changeFrequency: 'weekly', priority: 1.0, lastModified: now },
    { url: `${base}/products`, changeFrequency: 'daily',  priority: 0.9, lastModified: now },
  ]

  try {
    const supabase = getSupabaseAdminClient()

    const [categoriesRes, productsRes] = await Promise.all([
      supabase
        .from('categories')
        .select('slug')
        .order('name', { ascending: true }),
      supabase
        .from('products')
        .select('slug, updated_at, category:categories(slug)')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false }),
    ])

    const categoryEntries: MetadataRoute.Sitemap = (categoriesRes.data ?? [])
      .filter((c): c is { slug: string } => typeof c.slug === 'string' && c.slug.length > 0)
      .map((c) => ({
        url: `${base}/products/${c.slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
        lastModified: now,
      }))

    type ProductRow = {
      slug: string
      updated_at: string | null
      category: { slug: string } | { slug: string }[] | null
    }

    const productEntries: MetadataRoute.Sitemap = ((productsRes.data ?? []) as ProductRow[])
      .map((p) => {
        const category = Array.isArray(p.category) ? p.category[0] : p.category
        if (!category?.slug || !p.slug) return null
        return {
          url: `${base}/products/${category.slug}/${p.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    return [...staticEntries, ...categoryEntries, ...productEntries]
  } catch {
    return staticEntries
  }
}
