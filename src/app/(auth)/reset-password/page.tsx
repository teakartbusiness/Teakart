'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/auth/password-input'
import PasswordChecklist from '@/components/auth/password-checklist'
import { generatePassword, validatePassword, PASSWORD_RULES } from '@/lib/password'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Reset password — the landing page after the user clicks the link in their
 * password-reset email. By the time they get here, the auth callback has
 * already exchanged the recovery code for a short-lived session, so
 * `supabase.auth.updateUser({ password })` will succeed without re-auth.
 *
 * If they navigate here directly (no recovery session), we show a clear
 * "link invalid" state instead of silently failing on submit.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  // null = still checking, true = recovery session exists, false = no session
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  function handleGenerate() {
    const pw = generatePassword(16)
    setPassword(pw)
    setConfirm(pw)
    setPasswordVisible(true)
    setConfirmVisible(true)
    toast.success('Strong password generated — save it to your password manager.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const pwError = validatePassword(password)
    if (pwError) {
      toast.error(pwError)
      return
    }
    if (password !== confirm) {
      toast.error("Passwords don't match")
      return
    }

    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Password updated. You are now signed in.')
    router.push('/')
  }

  if (hasSession === null) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10" />
    )
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Reset link expired
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This password reset link is no longer valid (links expire after
          about an hour, and each one can only be used once). Request a fresh
          one and try again.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Send a new link
          </Link>
          <Link
            href="/sign-in"
            className="mt-2 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick something strong — you&apos;ll stay signed in once it&apos;s saved.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">New password</Label>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Generate strong password
            </button>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            visible={passwordVisible}
            onVisibleChange={setPasswordVisible}
            required
            minLength={PASSWORD_RULES.minLength}
            autoComplete="new-password"
          />
          <PasswordChecklist password={password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            visible={confirmVisible}
            onVisibleChange={setConfirmVisible}
            required
            minLength={PASSWORD_RULES.minLength}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
