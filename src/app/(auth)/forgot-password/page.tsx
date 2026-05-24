'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = getSupabaseBrowserClient()
    // After the user clicks the reset link, Supabase sends them to
    // /api/auth/callback which exchanges the code for a real session and
    // then forwards them to /reset-password where they pick a new password.
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          If an account exists for{' '}
          <span className="font-medium text-foreground">{email}</span>, we&apos;ve
          sent a password reset link. Click it to set a new password — the
          link expires in about an hour.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you signed up with — we&apos;ll send a link to
          reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
