import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import ProductRowActions from '@/components/admin/product-row-actions'
import AddProductDialog from '@/components/admin/add-product-dialog'
import type { Category, Product, ProductImage } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  await guardPage('products.manage')
  const supabase = getSupabaseAdminClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ])

  if (productsRes.error) {
    return (
      <div className="p-4 rounded-md bg-destructive-soft border border-destructive/30 text-sm text-destructive">
        Failed to load products: {productsRes.error.message}
      </div>
    )
  }

  const list = (productsRes.data ?? []) as Product[]
  const categories = (categoriesRes.data ?? []) as Category[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{list.length} total</p>
        </div>
        <AddProductDialog categories={categories} />
      </div>

      <div className="border border-border rounded-2xl overflow-x-auto bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-surface-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Image</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No products yet. Click <span className="font-medium text-foreground">Add product</span> above to create your first one.
                </td>
              </tr>
            )}
            {list.map((p) => {
              const hero = (p.images as ProductImage[] | null)?.[0]
              return (
                <tr key={p.id} className={p.is_deleted ? 'bg-muted/60' : ''}>
                  <td className="px-4 py-3">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted border border-border">
                      {hero ? (
                        <Image src={hero.url} alt={p.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-text-subtle">
                          No img
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">
                    ₹{p.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_deleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-destructive-soft text-destructive">
                        Deleted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-success-soft text-success">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions
                      productId={p.id}
                      productName={p.name}
                      isDeleted={p.is_deleted}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
