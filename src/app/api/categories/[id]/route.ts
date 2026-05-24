import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function isAdmin(): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && (await hasCapability('categories.manage'))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const body = await request.json() as {
    name?: string
    slug?: string
    description?: string
    cover_product_id?: string | null
    sellers_choice_product_id?: string | null
  }

  const admin = getSupabaseAdminClient()
  const updates: Record<string, unknown> = {}

  if (body.cover_product_id !== undefined) {
    if (body.cover_product_id === null) {
      updates.cover_product_id = null
    } else if (typeof body.cover_product_id === 'string') {
      // Cover must be a live product in THIS category.
      const { data: prod } = await admin
        .from('products')
        .select('id')
        .eq('id', body.cover_product_id)
        .eq('category_id', id)
        .eq('is_deleted', false)
        .maybeSingle()
      if (!prod) {
        return NextResponse.json(
          { error: 'Cover product must belong to this category' },
          { status: 400 },
        )
      }
      updates.cover_product_id = body.cover_product_id
    }
  }
  if (body.name !== undefined) {
    const trimmed = body.name.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    updates.name = trimmed
  }
  if (body.slug !== undefined) {
    const trimmed = body.slug.trim()
    if (!SLUG_REGEX.test(trimmed)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }
    updates.slug = trimmed
  }
  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  // Seller's choice — one highlighted product per category, stored on the
  // products table (is_sellers_choice). Setting one clears any previous pick in
  // the same category so there's only ever a single seller's choice per category.
  let touchedProducts = false
  if (body.sellers_choice_product_id !== undefined) {
    touchedProducts = true
    await admin
      .from('products')
      .update({ is_sellers_choice: false })
      .eq('category_id', id)
      .eq('is_sellers_choice', true)
    const scId = body.sellers_choice_product_id
    if (typeof scId === 'string' && scId) {
      const { data: prod } = await admin
        .from('products')
        .select('id')
        .eq('id', scId)
        .eq('category_id', id)
        .eq('is_deleted', false)
        .maybeSingle()
      if (!prod) {
        return NextResponse.json(
          { error: "Seller's choice product must belong to this category" },
          { status: 400 },
        )
      }
      await admin.from('products').update({ is_sellers_choice: true }).eq('id', scId)
    }
  }

  if (Object.keys(updates).length === 0 && !touchedProducts) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  let category: unknown = null
  if (Object.keys(updates).length > 0) {
    const { data, error } = await admin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with that slug already exists' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    category = data
  } else {
    const { data } = await admin.from('categories').select('*').eq('id', id).single()
    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    category = data
  }

  // Storefront badges + covers are page-cached; bust so changes show promptly.
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/products/[categorySlug]', 'layout')

  return NextResponse.json(category)
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
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    // ON DELETE RESTRICT — products still reference this category
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Cannot delete this category — products still belong to it. Move or delete those products first.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
