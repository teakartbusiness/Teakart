'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10" />
      }
    >
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Surface the duplicate-account error the auth callback redirected with.
  // Fire once on mount per visit.
  useEffect(() => {
    if (searchParams.get('error') === 'account-exists') {
      toast.error(
        'An account with that email already exists. Please sign in with your password instead.',
        { duration: 7000 },
      )
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/')
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to view your orders and addresses.
        </p>
      </div>

      <div className="mt-8">
        <GoogleSignInButton />
      </div>

      <div className="relative my-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-[0.15em]">
          <span className="bg-card px-3 text-muted-foreground">or with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
          Sign up
        </Link>
      </p>
    </div>
  )
}
