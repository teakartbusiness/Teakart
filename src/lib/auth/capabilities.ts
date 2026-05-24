import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ADMIN_SECTIONS } from '@/lib/admin-nav'
import { ALL_CAPABILITIES, type Capability } from '@/types'

function allCapsAccess(userId: string, email: string | null, isCeo: boolean): ViewerAccess {
  const all = new Set<Capability>(ALL_CAPABILITIES)
  return { userId, email, isCeo, capabilities: all, has: () => true, isStaff: true }
}

/**
 * Access control, server side.
 *
 * This is a single-admin store: the env ADMIN_EMAIL ("CEO") is the only staff
 * account and always has every capability. Everyone else is a customer with no
 * admin capabilities. (The capability engine is retained so the multi-role UI
 * can be reintroduced later without rewiring every page guard.)
 *
 * Use from server components (page guards) and API route handlers. Middleware
 * has its own Supabase client and resolves access inline — see middleware.ts.
 */

export type ViewerAccess = {
  userId: string
  email: string | null
  /** The env ADMIN_EMAIL bootstrap super-admin. */
  isCeo: boolean
  capabilities: Set<Capability>
  has: (cap: Capability) => boolean
  /** Has at least one admin capability — i.e. may enter /admin at all. */
  isStaff: boolean
}

function ceoEmail(): string | null {
  return process.env.ADMIN_EMAIL?.toLowerCase().trim() || null
}

/** Resolve the current viewer's access. Memoized per request. */
export const getViewerAccess = cache(async (): Promise<ViewerAccess | null> => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const email = user.email ?? null
  const ceo = ceoEmail()
  const isCeo = !!email && !!ceo && email.toLowerCase() === ceo

  if (isCeo) {
    return allCapsAccess(user.id, email, true)
  }

  // Single-admin store: anyone who isn't the CEO is a customer with no admin
  // capabilities.
  const caps = new Set<Capability>()
  return {
    userId: user.id,
    email,
    isCeo: false,
    capabilities: caps,
    has: (cap: Capability) => caps.has(cap),
    isStaff: false,
  }
})

/** True if the current viewer has the given capability (CEO always true). */
export async function hasCapability(cap: Capability): Promise<boolean> {
  const access = await getViewerAccess()
  return !!access && access.has(cap)
}

/** True if the current viewer may enter the admin panel at all. */
export async function isStaffViewer(): Promise<boolean> {
  const access = await getViewerAccess()
  return !!access && access.isStaff
}

/** True if the current viewer is the env ADMIN_EMAIL super-admin. */
export async function isCeoViewer(): Promise<boolean> {
  const access = await getViewerAccess()
  return !!access && access.isCeo
}

/**
 * The first admin section this viewer can actually open, in sidebar order.
 * Used as the redirect target when a viewer lands on a section they lack —
 * avoids bouncing them to /admin if they don't even have dashboard.view.
 * Falls back to the storefront if they have no admin access at all.
 */
export function firstAccessiblePath(access: ViewerAccess): string {
  const hit = ADMIN_SECTIONS.find((s) => s.anyOf.some((c) => access.has(c)))
  return hit?.href ?? '/'
}

/**
 * Page guard for admin server components. Redirects to /sign-in if not signed
 * in, or to the viewer's first accessible section if signed in but lacking the
 * capability. Accepts a single capability or an any-of list. Returns the
 * viewer's access on success.
 */
export async function guardPage(required: Capability | Capability[]): Promise<ViewerAccess> {
  const access = await getViewerAccess()
  if (!access) redirect('/sign-in')
  const list = Array.isArray(required) ? required : [required]
  if (!list.some((c) => access.has(c))) redirect(firstAccessiblePath(access))
  return access
}
