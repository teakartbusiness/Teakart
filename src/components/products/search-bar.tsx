'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

/**
 * Product search box. Submits to /products?q=<query> (the products page renders
 * a results grid when q is present). Two sizes:
 *   - 'hero'    : large, for the home hero
 *   - 'compact' : header / drawer
 */
export default function SearchBar({
  initialQuery = '',
  variant = 'hero',
  className = '',
  autoFocus = false,
  onSubmitted,
}: {
  initialQuery?: string
  variant?: 'hero' | 'compact'
  className?: string
  autoFocus?: boolean
  onSubmitted?: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : '/products')
    onSubmitted?.()
  }

  const hero = variant === 'hero'

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`relative flex items-center ${className}`}
    >
      <Search
        aria-hidden
        className={`pointer-events-none absolute text-muted-foreground ${
          hero ? 'left-4 size-5' : 'left-3 size-4'
        }`}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search products…"
        aria-label="Search products"
        className={`w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring ${
          hero
            ? 'py-3.5 pl-12 pr-28 text-base shadow-sm'
            : 'py-2 pl-9 pr-3 text-sm'
        }`}
      />
      {hero && (
        <button
          type="submit"
          className="absolute right-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Search
        </button>
      )}
    </form>
  )
}
