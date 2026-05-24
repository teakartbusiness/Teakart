'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface Identity {
  id: string
  identity_id: string
  user_id: string
  provider: string
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
}

interface Props {
  initialIdentities: Identity[]
}

const PROVIDER_META: Record<
  string,
  { label: string; description: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  email: {
    label: 'Email + password',
    description: 'Sign in with your email and a password.',
    Icon: Mail,
  },
  google: {
    label: 'Google',
    description: 'Sign in with your Google account.',
    Icon: GoogleMark,
  },
}

export default function ConnectedIdentitiesPanel({ initialIdentities }: Props) {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl border border-border bg-card" />}>
      <Inner initialIdentities={initialIdentities} />
    </Suspense>
  )
}

function Inner({ initialIdentities }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [identities, setIdentities] = useState<Identity[]>(initialIdentities)
  const [linking, setLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  // Re-fetch identities on mount and after a link/unlink so the list reflects
  // server state even if we landed here from a redirect.
  const refreshIdentities = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.getUserIdentities()
    if (error || !data) return
    setIdentities(
      data.identities.map((i) => ({
        id: i.id,
        identity_id: i.identity_id ?? i.id,
        user_id: i.user_id,
        provider: i.provider,
        email: (i.identity_data?.email as string | undefined) ?? null,
        created_at: i.created_at ?? null,
        last_sign_in_at: i.last_sign_in_at ?? null,
      })),
    )
  }, [])

  // Surface the post-link toast from /api/auth/callback?intent=link.
  useEffect(() => {
    const flag = searchParams.get('link')
    if (flag === 'ok') {
      toast.success('Google account connected.')
      refreshIdentities()
      // Strip the query so a refresh doesn't re-fire the toast.
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      params.delete('link')
      router.replace(`/account/settings${params.toString() ? `?${params}` : ''}`)
    } else if (flag === 'failed') {
      toast.error("Couldn't connect that Google account. Please try again.")
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      params.delete('link')
      router.replace(`/account/settings${params.toString() ? `?${params}` : ''}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const hasGoogle = identities.some((i) => i.provider === 'google')

  async function handleConnectGoogle() {
    setLinking(true)
    const supabase = getSupabaseBrowserClient()
    const redirectTo = `${window.location.origin}/api/auth/callback?intent=link&next=/account/settings`
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      toast.error(error.message)
      setLinking(false)
      return
    }
    // linkIdentity navigates the browser to Google; we won't reach this line.
  }

  async function handleDisconnect(identity: Identity) {
    const meta = PROVIDER_META[identity.provider]
    const label = meta?.label ?? identity.provider
    if (
      !confirm(
        `Disconnect ${label}? You'll need another way to sign in afterwards.`,
      )
    )
      return

    setUnlinkingId(identity.identity_id)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.unlinkIdentity({
      identity_id: identity.identity_id,
      id: identity.id,
      user_id: identity.user_id,
      provider: identity.provider,
      // Supabase's type expects the full identity object — these two are
      // unused on the server side but required by the type.
      identity_data: {},
      created_at: identity.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_sign_in_at: identity.last_sign_in_at ?? null,
    } as Parameters<typeof supabase.auth.unlinkIdentity>[0])

    if (error) {
      toast.error(error.message)
      setUnlinkingId(null)
      return
    }
    toast.success(`${label} disconnected.`)
    await refreshIdentities()
    setUnlinkingId(null)
  }

  const onlyOne = identities.length <= 1

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Connected sign-in methods
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Add more ways to sign in so you can use any of them later. You always
          need at least one.
        </p>
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {identities.map((identity) => {
          const meta = PROVIDER_META[identity.provider] ?? {
            label: identity.provider,
            description: 'Connected identity',
            Icon: Lock,
          }
          const { Icon } = meta
          const isUnlinking = unlinkingId === identity.identity_id
          return (
            <li
              key={identity.identity_id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-background">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {identity.email ?? meta.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDisconnect(identity)}
                disabled={onlyOne || isUnlinking}
                title={onlyOne ? 'You need at least one sign-in method' : undefined}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUnlinking ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </li>
          )
        })}
      </ul>

      {!hasGoogle && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Add Google sign-in</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Link your Google account to sign in faster next time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={linking}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark className="size-4" />
              {linking ? 'Redirecting…' : 'Connect Google'}
            </button>
          </div>
        </div>
      )}

      {hasGoogle && identities.length > 1 && (
        <p className="flex items-center gap-2 text-xs text-success">
          <Check className="size-3.5" />
          You can sign in with any of the methods above.
        </p>
      )}
    </section>
  )
}

/** Official Google "G" mark — inline so we don't pull in another icon set. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
    >
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  )
}
