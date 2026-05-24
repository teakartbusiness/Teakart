'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import PasswordInput from '@/components/auth/password-input'
import PasswordChecklist from '@/components/auth/password-checklist'
import { generatePassword, validatePassword, PASSWORD_RULES } from '@/lib/password'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleGenerate() {
    const pw = generatePassword(16)
    setPassword(pw)
    setPasswordVisible(true)
    toast.success('Strong password generated — save it to your password manager.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const normalizedPhone = phone.trim()
    if (!/^\+?[0-9 ]{8,15}$/.test(normalizedPhone)) {
      toast.error('Enter a valid phone number (digits only, optional leading +).')
      return
    }

    const pwError = validatePassword(password)
    if (pwError) {
      toast.error(pwError)
      return
    }

    setLoading(true)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: normalizedPhone } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We sent a confirmation link to{' '}
          <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your account.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Already confirmed?{' '}
          <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One account for orders, addresses, and updates.
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
        </div>

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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  )
}
