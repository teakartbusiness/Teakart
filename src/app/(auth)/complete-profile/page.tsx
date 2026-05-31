'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Landing page for newly-signed-up users who came in via OAuth (Google) and
 * therefore don't have a phone number on file. Pre-fills name from the
 * OAuth profile, then asks for the phone before letting them through.
 *
 * Reachable manually too — any signed-in user with a missing phone can
 * complete or update their profile here.
 */
export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10" />
      }
    >
      <CompleteProfileForm />
    </Suspense>
  )
}

function CompleteProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      // Pre-fill from existing row + OAuth metadata. Existing row wins for
      // name if it's set; OAuth metadata fills in for first-time visitors.
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        ''
      const { data: row } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      setFullName(row?.full_name ?? metaName)
      setPhone(row?.phone ?? '')
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = fullName.trim()
    const normalizedPhone = phone.trim()
    if (!trimmedName) {
      toast.error('Please enter your name.')
      return
    }
    if (!/^\+?[0-9 ]{8,15}$/.test(normalizedPhone)) {
      toast.error('Enter a valid phone number (digits only, optional leading +).')
      return
    }

    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }

    // Upsert (not update) — for OAuth sign-ups the public.users row doesn't
    // exist yet (the trigger only creates it when phone is provided up-front,
    // and Google doesn't send phone). Upsert inserts on first save and
    // updates on subsequent edits.
    const { error } = await supabase
      .from('users')
      .upsert(
        { id: user.id, full_name: trimmedName, phone: normalizedPhone },
        { onConflict: 'id' },
      )

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Profile saved.')
    router.push(next)
  }

  if (!ready) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10" />
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Almost there
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A couple of details to finish setting up your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (WhatsApp)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">
            Can be used to contact you if needed.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>

      {/* Escape hatch — if the wrong Google account got picked, give them
          a one-click way out of this page instead of forcing them to dig
          around for sign-out. */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Not your account?{' '}
        <button
          type="button"
          onClick={async () => {
            const supabase = getSupabaseBrowserClient()
            await supabase.auth.signOut()
            router.push('/sign-in')
          }}
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
        >
          Sign out
        </button>
      </p>
    </div>
  )
}
