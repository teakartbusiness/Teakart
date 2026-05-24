import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasCapability } from '@/lib/auth/capabilities'
import { uploadImage, deleteImage } from '@/lib/cloudinary'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const PUBLIC_ID_PREFIX = 'products/' // only allow deletes inside our own folder

async function requireAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await hasCapability('products.manage'))) return false
  return true
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File is too large — limit is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` },
      { status: 413 }
    )
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Only image files are allowed (got ${file.type || 'unknown'})` },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url, public_id } = await uploadImage(buffer, 'products')

  return NextResponse.json({ url, public_id })
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { public_id } = await request.json() as { public_id: string }

  if (!public_id || typeof public_id !== 'string') {
    return NextResponse.json({ error: 'public_id required' }, { status: 400 })
  }
  // Defense in depth: only allow deleting Cloudinary IDs in our own folder.
  // Without this, a compromised admin session could ask us to delete arbitrary
  // assets in the Cloudinary account.
  if (!public_id.startsWith(PUBLIC_ID_PREFIX)) {
    return NextResponse.json({ error: 'public_id outside allowed folder' }, { status: 400 })
  }

  await deleteImage(public_id)

  return NextResponse.json({ success: true })
}
