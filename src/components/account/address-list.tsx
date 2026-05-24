'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Address } from '@/types'

const EMPTY_FORM = { full_address: '', city: '', state: '', pincode: '' }

const inputClass =
  'rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function AddressList({ addresses }: { addresses: Address[] }) {
  const router = useRouter()
  const [list, setList] = useState<Address[]>(addresses)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddSubmitting(true)

    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })

    if (res.ok) {
      const created: Address = await res.json()
      setList((prev) => [created, ...prev])
      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
      toast.success('Address added.')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to add address' }))
      toast.error(data.error ?? 'Failed to add address')
    }
    setAddSubmitting(false)
  }

  function startEdit(address: Address) {
    setEditingId(address.id)
    setEditForm({
      full_address: address.full_address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setEditSubmitting(true)

    const res = await fetch(`/api/addresses/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })

    if (res.ok) {
      const replacement: Address = await res.json()
      setList((prev) => [replacement, ...prev.filter((a) => a.id !== editingId)])
      cancelEdit()
      toast.success('Address updated.')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to update address' }))
      toast.error(data.error ?? 'Failed to update address')
    }
    setEditSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return
    setDeletingId(id)

    const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })

    if (res.ok) {
      setList((prev) => prev.filter((a) => a.id !== id))
      toast.success('Address removed.')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to delete' }))
      toast.error(data.error ?? 'Failed to delete')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {list.length === 0 && !showAddForm && (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No saved addresses yet.
        </p>
      )}

      <ul className="space-y-3">
        {list.map((address) =>
          editingId === address.id ? (
            <li key={address.id}>
              <form
                onSubmit={handleEditSubmit}
                className="space-y-3 rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Edit address
                </h3>
                <textarea
                  required
                  placeholder="Full address"
                  value={editForm.full_address}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_address: e.target.value }))}
                  rows={2}
                  className={`${inputClass} w-full resize-none`}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(['city', 'state', 'pincode'] as const).map((field) => (
                    <input
                      key={field}
                      required
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={editForm[field]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                      className={inputClass}
                    />
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {editSubmitting ? 'Updating…' : 'Update address'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={editSubmitting}
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </li>
          ) : (
            <li
              key={address.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{address.full_address}</p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} — {address.pincode}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive-soft disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  {deletingId === address.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          )
        )}
      </ul>

      {showAddForm ? (
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            New address
          </h3>
          <textarea
            required
            placeholder="Full address"
            value={addForm.full_address}
            onChange={(e) => setAddForm((f) => ({ ...f, full_address: e.target.value }))}
            rows={2}
            className={`${inputClass} w-full resize-none`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['city', 'state', 'pincode'] as const).map((field) => (
              <input
                key={field}
                required
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={addForm[field]}
                onChange={(e) => setAddForm((f) => ({ ...f, [field]: e.target.value }))}
                className={inputClass}
              />
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={addSubmitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {addSubmitting ? 'Saving…' : 'Save address'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddForm(EMPTY_FORM)
              }}
              className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-4" />
          Add new address
        </button>
      )}
    </div>
  )
}
