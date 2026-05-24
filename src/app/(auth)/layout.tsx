import type { Metadata } from 'next'
import Link from 'next/link'
import BackButton from '@/components/layout/back-button'
import Logo from '@/components/layout/logo'
import ThemeToggle from '@/components/layout/theme-toggle'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="TeaKart — home"
          className="inline-flex items-center transition-opacity hover:opacity-85"
        >
          <Logo className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <BackButton />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
