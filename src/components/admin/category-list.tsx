'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import CategoryDialog from './category-dialog'
import type { Category } from '@/types'

export type CoverOption = { id: string; name: string; heroUrl: string | null }
type CategoryRow = Category & {
  product_count: number
  cover_options: CoverOption[]
  sellers_choice_id: string | null
}

interface Props {
  initial: CategoryRow[]
}

export default function CategoryList({ initial }: Props) {
  const router = useRouter()
  const [list, setList] = useState<CategoryRow[]>(initial)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(category: CategoryRow) {
    setEditTarget(category)
    setDialogOpen(true)
  }

  function handleSaved(saved: Category) {
    setList((prev) => {
      const existing = prev.find((c) => c.id === saved.id)
      const merged: CategoryRow = {
        ...saved,
        product_count: existing?.product_count ?? 0,
        cover_options: existing?.cover_options ?? [],
        sellers_choice_id: existing?.sellers_choice_id ?? null,
      }
      const others = prev.filter((c) => c.id !== saved.id)
      return [...others, merged].sort((a, b) => a.name.localeCompare(b.name))
    })
    router.refresh()
  }

  async function handleDelete(category: CategoryRow) {
    if (!confirm(`Delete category "${category.name}"?`)) return

    setDeletingId(category.id)

    const res = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' })

    if (res.ok) {
      setList((prev) => prev.filter((c) => c.id !== category.id))
      toast.success(`Deleted "${category.name}".`)
      router.refresh()
    } else {
      const { error } = (await res.json().catch(() => ({ error: 'Failed to delete' }))) as {
        error?: string
      }
      toast.error(error ?? 'Failed to delete')
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add category
        </button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No categories yet. Click <span className="font-medium text-foreground">Add category</span> to create your first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Products</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-foreground">{c.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {c.product_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive-soft disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === c.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editTarget}
        onSaved={handleSaved}
      />
    </div>
  )
}
