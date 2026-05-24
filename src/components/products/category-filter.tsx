import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  /** The slug of the currently active category, or null for the "All" view. */
  activeSlug: string | null
}

export default function CategoryFilter({ categories, activeSlug }: Props) {
  if (categories.length === 0) return null

  return (
    <nav
      aria-label="Product categories"
      className="-mx-4 mb-8 px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        <li>
          <Link
            href="/products"
            className={cn(
              'inline-flex shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeSlug === null
                ? 'border-foreground bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-muted'
            )}
          >
            All
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/products/${c.slug}`}
              className={cn(
                'inline-flex shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                activeSlug === c.slug
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-muted'
              )}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
