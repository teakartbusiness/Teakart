import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  PRODUCT_LIMITS,
  SLUG_REGEX,
  validateAttributes,
  validateVariants,
} from '@/lib/validation/product'
import type { Product } from '@/types'

// Edge runtime — both Supabase clients in this file are fetch-based, the
// validators are pure JS, and revalidatePath is Edge-safe. Cold starts are
// noticeably faster than the default Node runtime.
export const runtime = 'edge'

// Bust ISR caches that depend on the product catalog. Called after every
// successful mutation. The 'layout' variant covers /products/[categorySlug]
// and every product detail nested under it.
function bustProductCaches() {
  revalidatePath('/products')
  revalidatePath('/products/[categorySlug]', 'layout')
}

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get('categorySlug')

  const supabase = await getSupabaseServerClient()

  let categoryId: string | null = null

  if (categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (categoryError || !category) {
      return NextResponse.json([] as Product[])
    }

    categoryId = category.id
  }

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Product[])
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('products.manage'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const price = typeof body.price === 'number' ? body.price : NaN
  const category_id = typeof body.category_id === 'string' ? body.category_id : ''

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (name.length > PRODUCT_LIMITS.name) {
    return NextResponse.json({ error: `Name too long (max ${PRODUCT_LIMITS.name})` }, { status: 400 })
  }
  if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
      { status: 400 }
    )
  }
  if (description.length > PRODUCT_LIMITS.description) {
    return NextResponse.json({ error: 'Description too long' }, { status: 400 })
  }
  if (!Number.isFinite(price) || price < 0 || price > PRODUCT_LIMITS.price) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }
  if (!category_id) return NextResponse.json({ error: 'Category is required' }, { status: 400 })

  const variantsResult = validateVariants(body.variants ?? [])
  if ('error' in variantsResult) return NextResponse.json({ error: variantsResult.error }, { status: 400 })

  const attributesResult = validateAttributes(body.attributes ?? [])
  if ('error' in attributesResult) return NextResponse.json({ error: attributesResult.error }, { status: 400 })

  const isSellersChoice = typeof body.is_sellers_choice === 'boolean' ? body.is_sellers_choice : false

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('products')
    .insert({
      name,
      slug,
      description: description || null,
      price,
      category_id,
      variants: variantsResult,
      images: [],
      attributes: attributesResult,
      is_sellers_choice: isSellersChoice,
      is_deleted: false,
    })
    .select('*, category:categories(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with that slug already exists' }, { status: 409 })
    }
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  bustProductCaches()
  return NextResponse.json(data as Product, { status: 201 })
}
