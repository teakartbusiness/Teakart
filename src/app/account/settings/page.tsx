import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import ConnectedIdentitiesPanel, {
  type Identity,
} from '@/components/account/connected-identities-panel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account settings',
}

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/account/settings')

  // `identities` is populated on the user object as long as the session is
  // fresh. Fall back to an empty array so the panel renders even if Supabase
  // ever returns it null (shouldn't, but defensive).
  const identities: Identity[] = (user.identities ?? []).map((i) => ({
    id: i.id,
    identity_id: i.identity_id ?? i.id,
    user_id: i.user_id,
    provider: i.provider,
    email: (i.identity_data?.email as string | undefined) ?? user.email ?? null,
    created_at: i.created_at ?? null,
    last_sign_in_at: i.last_sign_in_at ?? null,
  }))

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how you sign in to {user.email ? user.email : 'your account'}.
        </p>
      </header>

      <ConnectedIdentitiesPanel initialIdentities={identities} />
    </div>
  )
}
