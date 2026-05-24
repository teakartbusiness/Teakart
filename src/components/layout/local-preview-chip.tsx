import Link from 'next/link'
import { Eye } from 'lucide-react'

/**
 * Floating indicator shown to the signed-in admin whenever a local theme
 * preview is overriding the published theme for them. Click → /admin/customize
 * where Publish / Discard live.
 *
 * Rendered by the root layout when `ThemeContext.isPreview === true`.
 */
export default function LocalPreviewChip() {
  return (
    <Link
      href="/admin/customize"
      aria-label="Local theme preview is active — open customize page to publish or discard"
      className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-warning-ring bg-warning-soft px-3.5 py-2 text-xs font-semibold text-warning-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-105 print:hidden"
    >
      <Eye className="size-3.5" />
      Local preview · Manage
    </Link>
  )
}
