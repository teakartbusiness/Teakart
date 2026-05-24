import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hasCapability } from '@/lib/auth/capabilities'
import {
  PRODUCT_LIMITS,
  SLUG_REGEX,
  validateAttributes,
  validateImages,
  validateVariants,
} from '@/lib/validation/product'
import type { Product } from '@/types'

function bustProductCaches() {
  revalidatePath('/products')
  revalidatePath('/products/[categorySlug]', 'layout')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(data as Product)
}

async function isAdmin(): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && (await hasCapability('products.manage'))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    if (name.length > PRODUCT_LIMITS.name) {
      return NextResponse.json({ error: `Name too long (max ${PRODUCT_LIMITS.name})` }, { status: 400 })
    }
    updates.name = name
  }

  if ('slug' in body) {
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    if (!slug || !SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }
    updates.slug = slug
  }

  if ('description' in body) {
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (description.length > PRODUCT_LIMITS.description) {
      return NextResponse.json({ error: 'Description too long' }, { status: 400 })
    }
    updates.description = description || null
  }

  if ('price' in body) {
    const price = typeof body.price === 'number' ? body.price : NaN
    if (!Number.isFinite(price) || price < 0 || price > PRODUCT_LIMITS.price) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
    }
    updates.price = price
  }

  if ('category_id' in body) {
    const category_id = typeof body.category_id === 'string' ? body.category_id : ''
    if (!category_id) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    updates.category_id = category_id
  }

  if ('variants' in body) {
    const result = validateVariants(body.variants)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    updates.variants = result
  }

  if ('attributes' in body) {
    const result = validateAttributes(body.attributes)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    updates.attributes = result
  }

  if ('images' in body) {
    const result = validateImages(body.images)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    updates.images = result
  }

  if ('is_sellers_choice' in body) {
    if (typeof body.is_sellers_choice !== 'boolean') {
      return NextResponse.json({ error: 'is_sellers_choice must be a boolean' }, { status: 400 })
    }
    updates.is_sellers_choice = body.is_sellers_choice
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('is_deleted', false)
    .select('*, category:categories(*)')
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A product with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message ?? 'Product not found' }, { status: error ? 500 : 404 })
  }

  bustProductCaches()
  return NextResponse.json(data as Product)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('products')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('is_deleted', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  bustProductCaches()
  return new NextResponse(null, { status: 204 })
}
