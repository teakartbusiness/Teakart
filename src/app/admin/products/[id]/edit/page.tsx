import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import NewProductFormWrapper from '@/components/admin/new-product-form-wrapper'
import type { Category, Product } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await guardPage('products.manage')
  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true }),
  ])

  if (productRes.error || !productRes.data) {
    notFound()
  }

  if (categoriesRes.error) {
    return (
      <div className="p-4 rounded-md bg-destructive-soft border border-destructive/30 text-sm text-destructive">
        Failed to load categories: {categoriesRes.error.message}
      </div>
    )
  }

  const product = productRes.data as Product
  const categories = (categoriesRes.data ?? []) as Category[]

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Products
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-1">
          Edit product
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{product.slug}</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <NewProductFormWrapper product={product} categories={categories} />
      </div>
    </div>
  )
}
