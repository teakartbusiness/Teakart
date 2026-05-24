import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { guardPage } from '@/lib/auth/capabilities'
import AdminReviewsList from '@/components/admin/admin-reviews-list'
import AdminReviewSettingsForm from '@/components/admin/admin-review-settings-form'
import type { ProductReview } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Reviews' }

export default async function AdminReviewsPage() {
  await guardPage('reviews.moderate')
  const supabase = getSupabaseAdminClient()

  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase
      .from('product_reviews')
      .select('id, rating, body, image_urls, is_hidden, created_at, product:products(name, slug, category:categories(slug)), user:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('review_settings')
      .select('max_images_per_review')
      .eq('id', 1)
      .maybeSingle(),
  ])

  const maxImagesDefault =
    typeof settings?.max_images_per_review === 'number'
      ? settings.max_images_per_review
      : 1

  if (error) {
    if (error.code === '42P01' || /product_reviews/i.test(error.message)) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
          <div className="rounded-2xl border border-warning-ring bg-warning-soft p-5 text-sm text-warning-foreground">
            <p className="font-semibold">Run migration 027 in <code>migrations-to-run.sql</code> to enable reviews.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive">
        Failed to load reviews: {error.message}
      </div>
    )
  }

  type Row = ProductReview & {
    product: { name: string; slug: string; category: { slug: string } | null } | null
    user: { full_name: string | null } | null
  }

  const rows = (data ?? []).map((r) => {
    const product = Array.isArray(r.product) ? r.product[0] ?? null : r.product
    const category = product
      ? Array.isArray(product.category)
        ? product.category[0] ?? null
        : product.category
      : null
    return {
      ...r,
      product: product ? { name: product.name, slug: product.slug, category } : null,
      user: Array.isArray(r.user) ? r.user[0] ?? null : r.user,
    } as unknown as Row
  })

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hide abusive or off-topic reviews. Hiding is soft — you can restore it later.
        </p>
      </div>
      <AdminReviewSettingsForm initialMaxImages={maxImagesDefault} />
      <AdminReviewsList initial={rows} />
    </div>
  )
}
