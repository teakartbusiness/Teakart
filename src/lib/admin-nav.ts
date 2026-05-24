import type { Capability } from '@/types'
import type { AdminPendingCounts } from '@/lib/admin-counts'

export type AdminSection = {
  href: string
  label: string
  /** Active-state matching: exact path vs. startsWith. */
  exact: boolean
  /** Show/allow only if the viewer has at least one of these capabilities. */
  anyOf: Capability[]
  /** Which pending-count badge to show next to this item, if any. */
  countKey?: keyof AdminPendingCounts
}

/**
 * Canonical, ordered list of admin sections. Single source of truth for:
 *   - sidebar visibility + ordering (admin-sidebar.tsx)
 *   - the page guard's "where do I send a user who lacks this capability?"
 *     landing logic (lib/auth/capabilities.ts → firstAccessiblePath)
 *
 * Every section requires a capability — including the dashboard, so it isn't
 * visible just because someone holds some other capability.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  { href: '/admin',               label: 'Dashboard',     exact: true,  anyOf: ['dashboard.view'] },
  { href: '/admin/products',      label: 'Products',      exact: false, anyOf: ['products.manage'] },
  { href: '/admin/categories',    label: 'Categories',    exact: false, anyOf: ['categories.manage'] },
  { href: '/admin/orders',        label: 'Orders',        exact: false, anyOf: ['orders.view', 'orders.update_status'], countKey: 'orders' },
  { href: '/admin/reviews',       label: 'Reviews',       exact: false, anyOf: ['reviews.moderate', 'reviews.settings'] },
  { href: '/admin/customize',     label: 'Customize',     exact: false, anyOf: ['theme.edit'] },
]
