'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  productId: string
  productName: string
  isDeleted: boolean
}

export default function ProductRowActions({ productId, productName, isDeleted }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This soft-deletes the product.`)) return
    setDeleting(true)
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`"${productName}" deleted.`)
      router.refresh()
    } else {
      setDeleting(false)
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1 text-xs font-medium transition-colors hover:bg-surface-muted"
      >
        <Pencil className="size-3.5" />
        Edit
      </Link>
      {!isDeleted && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive-soft disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      )}
    </div>
  )
}
