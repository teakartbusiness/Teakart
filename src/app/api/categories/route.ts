import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function isAdmin(): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && (await hasCapability('categories.manage'))
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    name?: string
    slug?: string
    description?: string
  }

  const name = body.name?.trim()
  const slug = body.slug?.trim()

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must be lowercase letters, numbers, and hyphens only (e.g. office-chairs)' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('categories')
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A category with that slug already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
