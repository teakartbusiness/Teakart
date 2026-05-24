// One-shot diagnostic for the "connected Google and lost orders/addresses" report.
// Lists auth.users + public.users + orders + addresses for the given email so
// we can see if linkIdentity spawned a duplicate user.
//
// Usage:
//   node scripts/diagnose-google-link.mjs khalidqureshi1198@gmail.com

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const targetEmail = process.argv[2]
if (!targetEmail) {
  console.error('Usage: node scripts/diagnose-google-link.mjs <email>')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

console.log(`\n=== Auth users with email: ${targetEmail} ===`)
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
const matches = users.filter((u) => u.email === targetEmail)
if (matches.length === 0) {
  console.log('  (none)')
} else {
  for (const u of matches) {
    console.log(`  id: ${u.id}`)
    console.log(`    created_at:    ${u.created_at}`)
    console.log(`    last_sign_in:  ${u.last_sign_in_at}`)
    console.log(`    providers:     ${u.app_metadata?.providers?.join(', ') ?? '(none)'}`)
    console.log(`    identities:    ${(u.identities ?? []).map((i) => i.provider).join(', ') || '(none)'}`)
    console.log()
  }
}

console.log(`=== public.users rows for those ids ===`)
const ids = matches.map((u) => u.id)
if (ids.length > 0) {
  const { data: rows, error } = await admin
    .from('users')
    .select('id, full_name, phone, created_at')
    .in('id', ids)
  if (error) console.log('  ERROR:', error.message)
  else if (!rows || rows.length === 0) console.log('  (no public.users rows found)')
  else for (const r of rows) console.log(`  ${r.id}  name="${r.full_name}"  phone="${r.phone}"`)
} else {
  console.log('  (skipped — no auth.users matched)')
}

console.log(`\n=== orders per user_id ===`)
if (ids.length > 0) {
  for (const id of ids) {
    const { count } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
    console.log(`  ${id}: ${count ?? 0} orders`)
  }
} else {
  console.log('  (skipped)')
}

console.log(`\n=== addresses per user_id ===`)
if (ids.length > 0) {
  for (const id of ids) {
    const { count } = await admin
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
    console.log(`  ${id}: ${count ?? 0} addresses`)
  }
} else {
  console.log('  (skipped)')
}

console.log('\nDone.')
