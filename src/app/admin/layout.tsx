import type { Metadata } from "next"
import AdminShell from "@/components/layout/admin-shell"
import { loadAdminPendingCounts } from "@/lib/admin-counts"
import { getViewerAccess } from "@/lib/auth/capabilities"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [counts, access] = await Promise.all([loadAdminPendingCounts(), getViewerAccess()])
  const capabilities = access ? Array.from(access.capabilities) : []
  return (
    <AdminShell counts={counts} capabilities={capabilities}>
      {children}
    </AdminShell>
  )
}
