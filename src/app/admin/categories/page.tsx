import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import CategoryList from '@/components/admin/category-list'
import type { Category, ProductImage } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await guardPage('categories.manage')
  const supabase = getSupabaseAdminClient()

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase
      .from('products')
      .select('id, category_id, name, images, is_sellers_choice')
      .eq('is_deleted', false)
      .order('name', { ascending: true }),
  ])

  if (categoriesRes.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive">
        Failed to load categories: {categoriesRes.error.message}
      </div>
    )
  }

  // Per-category product count + cover options (each product's hero image), so
  // the edit dialog can offer "pick the category cover" + "pick the seller's
  // choice" thumbnail grids. Also surface the current seller's-choice product.
  type ProdRow = {
    id: string
    category_id: string
    name: string
    images: ProductImage[]
    is_sellers_choice: boolean
  }
  const optionsByCategory = new Map<string, { id: string; name: string; heroUrl: string | null }[]>()
  const sellersChoiceByCategory = new Map<string, string>()
  for (const row of (productsRes.data ?? []) as ProdRow[]) {
    const hero = [...(row.images ?? [])].sort((a, b) => a.position - b.position)[0]?.url ?? null
    const bucket = optionsByCategory.get(row.category_id) ?? []
    bucket.push({ id: row.id, name: row.name, heroUrl: hero })
    optionsByCategory.set(row.category_id, bucket)
    if (row.is_sellers_choice) sellersChoiceByCategory.set(row.category_id, row.id)
  }

  const categories = ((categoriesRes.data ?? []) as Category[]).map((c) => ({
    ...c,
    product_count: optionsByCategory.get(c.id)?.length ?? 0,
    cover_options: optionsByCategory.get(c.id) ?? [],
    sellers_choice_id: sellersChoiceByCategory.get(c.id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'} · used to group products on the storefront
        </p>
      </div>

      <CategoryList initial={categories} />
    </div>
  )
}
