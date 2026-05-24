import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Auth callback shared by every email-triggered or OAuth flow that lands
 * the user back in the app — email-confirm sign-up, magic link, password
 * reset, and Google OAuth.
 *
 * Behavior:
 *   1. Exchange the PKCE `code` for a real session.
 *   2. Detect the "duplicate account" case: Supabase, by default, doesn't
 *      auto-link a fresh OAuth identity to an existing email/password user
 *      with the same email — it spawns a parallel user with a new UUID.
 *      That's a confusing dead-end (the new session has no orders, no
 *      addresses). We catch it here, delete the just-created OAuth user,
 *      sign out the session, and redirect to /sign-in?error=account-exists.
 *   3. If the user's profile hasn't been completed (no public.users row
 *      yet — the trigger only creates it when phone is provided), divert
 *      them to /complete-profile so we collect phone before the row gets
 *      inserted.
 *   4. Otherwise forward to whatever `next` destination the original
 *      caller asked for (validated to be a same-origin path).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const rawNext = request.nextUrl.searchParams.get('next')
  // intent=link → this is `supabase.auth.linkIdentity` returning from the
  // provider. The user was already signed in; we MUST NOT run the
  // duplicate-account deletion below (which would nuke their real account),
  // and we don't need /complete-profile (they already have a row).
  const intent = request.nextUrl.searchParams.get('intent')
  const isLink = intent === 'link'

  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : isLink ? '/account/settings' : '/'

  if (!code) {
    return NextResponse.redirect(new URL(isLink ? '/account/settings' : '/sign-in', request.url))
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const dest = isLink ? '/account/settings' : '/sign-in'
    const url = new URL(dest, request.url)
    if (isLink) url.searchParams.set('link', 'failed')
    return NextResponse.redirect(url)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL(isLink ? '/account/settings' : '/sign-in', request.url))
  }

  // Linking flow: short-circuit before the duplicate-detection branch runs.
  // After exchangeCodeForSession the new identity is attached to the same
  // user row, so there's no duplicate to clean up — and we don't want to
  // re-divert through /complete-profile.
  if (isLink) {
    const url = new URL(next, request.url)
    url.searchParams.set('link', 'ok')
    return NextResponse.redirect(url)
  }

  // Duplicate-account check — does another auth.users row share this email?
  // Note: listUsers is paginated; perPage default is 50, max 1000. For a
  // small shop this is fine. If user count ever grows past a few thousand,
  // replace with a SECURITY DEFINER SQL function that queries auth.users
  // directly by email.
  if (user.email) {
    try {
      const adminClient = getSupabaseAdminClient()
      const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const peers = (data?.users ?? []).filter(
        (u) => u.email === user.email && u.id !== user.id,
      )

      if (peers.length > 0) {
        // Wipe the just-created duplicate so the email isn't owned by two
        // rows going forward, sign out the session, and route the visitor
        // back to /sign-in with a clear error. Their original account
        // (and all its data) stays untouched.
        await adminClient.auth.admin.deleteUser(user.id)
        await supabase.auth.signOut()
        const url = new URL('/sign-in', request.url)
        url.searchParams.set('error', 'account-exists')
        return NextResponse.redirect(url)
      }
    } catch {
      // If the admin probe fails we don't want to brick the sign-in flow.
      // Fall through; duplicates can still be cleaned up manually from
      // the Supabase dashboard if they slip through.
    }
  }

  // Password-reset destination is special — the user has to set their
  // password before anything else. Don't divert them through profile
  // completion; we can catch missing phone on a later sign-in.
  if (next === '/reset-password') {
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Profile complete? With the new trigger we only have a public.users row
  // when phone has been collected, so the absence of a row IS the signal
  // to send the visitor through /complete-profile.
  const { data: row } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle()

  if (!row?.phone) {
    const completeUrl = new URL('/complete-profile', request.url)
    completeUrl.searchParams.set('next', next)
    return NextResponse.redirect(completeUrl)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
