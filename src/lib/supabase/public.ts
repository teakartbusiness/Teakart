import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free Supabase client for public storefront reads.
 *
 * The cookie-aware `getSupabaseServerClient` opts a route out of static
 * generation, so pages that use it can never be ISR'd. This client uses
 * the anon publishable key with no session binding — RLS policies still
 * scope what anon can read (products with is_deleted=false, all categories).
 *
 * Use this for storefront product/category lookups that should be cacheable.
 * Use `getSupabaseServerClient` whenever the response depends on the signed-in
 * user (account pages, checkout, order detail, etc.).
 */
export function getSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
