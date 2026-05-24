import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/**
 * Subtle clickable path trail, e.g. Home / Shop / Chairs / Abnor Chair.
 * The last crumb is the current page (not a link). Sits alongside (not instead
 * of) the back button.
 */
export default function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[]
  className?: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground ${className ?? ''}`}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-x-1.5">
            {item.href && !last ? (
              <Link
                href={item.href}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={last ? 'font-medium text-foreground' : undefined}
                aria-current={last ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!last && (
              <span aria-hidden className="text-text-subtle">
                /
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
