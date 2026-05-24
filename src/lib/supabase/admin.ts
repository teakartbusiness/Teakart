import { createClient } from '@supabase/supabase-js'

function jwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8')
    const payload = JSON.parse(payloadJson) as { role?: string }
    return payload.role ?? null
  } catch {
    return null
  }
}

/**
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * Use ONLY in server-side code (server components on admin pages,
 * admin API route handlers, webhooks) after verifying the caller is
 * authorized. Never expose this client or its credentials to the browser.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — admin pages and webhooks require the service-role key from Supabase Dashboard → Project Settings → API.'
    )
  }

  // If the key is a legacy JWT, verify the role. New-format secret keys
  // (sb_secret_*) don't decode this way — skip the check for those.
  if (key.startsWith('eyJ')) {
    const role = jwtRole(key)
    if (role && role !== 'service_role') {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY contains a key with role="${role}", not "service_role". ` +
        `Copy the service_role key from Supabase Dashboard → Project Settings → API.`
      )
    }
  }

  return createClient(url, key, { auth: { persistSession: false } })
}
