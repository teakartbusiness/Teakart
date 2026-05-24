'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Category } from '@/types'

type CoverOption = { id: string; name: string; heroUrl: string | null }

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  /** If passed, dialog renders in "edit" mode. Otherwise it creates a new category. */
  category?: (Category & { cover_options?: CoverOption[]; sellers_choice_id?: string | null }) | null
  onSaved: (category: Category) => void
}

const EMPTY_FORM = { name: '', slug: '', description: '' }

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function CategoryDialog({ open, onOpenChange, category, onSaved }: Props) {
  const isEdit = !!category

  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [coverId, setCoverId] = useState<string | null>(null)
  const [sellersChoiceId, setSellersChoiceId] = useState<string | null>(null)

  const coverOptions = category?.cover_options ?? []

  // Reset form state whenever the dialog opens (or the target category changes).
  useEffect(() => {
    if (!open) return
    setForm(
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
          }
        : EMPTY_FORM
    )
    setSlugTouched(!!category)
    setCoverId(category?.cover_product_id ?? null)
    setSellersChoiceId(category?.sellers_choice_id ?? null)
  }, [open, category])

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const url = isEdit ? `/api/categories/${category!.id}` : '/api/categories'
    const method = isEdit ? 'PATCH' : 'POST'

    const payload: Record<string, unknown> = { ...form }
    if (isEdit) {
      payload.cover_product_id = coverId
      payload.sellers_choice_product_id = sellersChoiceId
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({ error: 'Request failed' }))) as {
        error?: string
      }
      toast.error(error ?? 'Request failed')
      setSaving(false)
      return
    }

    const result = (await res.json()) as Category
    toast.success(isEdit ? 'Category updated.' : 'Category created.')
    setSaving(false)
    onSaved(result)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            Categories group products on the storefront. The slug shows up in the URL.
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cat-name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                autoFocus
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-slug" className="text-sm font-medium text-foreground">
                Slug
              </label>
              <input
                id="cat-slug"
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }}
                placeholder="e.g. office-chairs"
                className={`${inputClass} font-mono`}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs like <span className="font-mono">/products/{form.slug || 'your-slug'}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-desc" className="text-sm font-medium text-foreground">
                Description{' '}
                <span className="font-normal text-text-subtle">(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputClass} resize-none`}
              />
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  Category cover{' '}
                  <span className="font-normal text-text-subtle">(shown on the shop landing)</span>
                </span>
                {coverOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add products to this category to choose a cover image.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Pick a product whose photo represents this category. Default uses the first product.
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setCoverId(null)}
                        className={`flex aspect-square items-center justify-center rounded-lg border text-center text-[11px] font-medium transition-colors ${
                          coverId === null
                            ? 'border-primary bg-muted text-foreground ring-2 ring-ring'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Default
                      </button>
                      {coverOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCoverId(opt.id)}
                          title={opt.name}
                          aria-pressed={coverId === opt.id}
                          className={`relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all ${
                            coverId === opt.id
                              ? 'border-primary ring-2 ring-ring'
                              : 'border-border hover:opacity-90'
                          }`}
                        >
                          {opt.heroUrl ? (
                            <Image src={opt.heroUrl} alt={opt.name} fill className="object-cover" sizes="100px" />
                          ) : (
                            <span className="flex h-full items-center justify-center px-1 text-[10px] text-text-subtle">
                              {opt.name}
                            </span>
                          )}
                          {coverId === opt.id && (
                            <span className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {isEdit && (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  Seller&apos;s choice{' '}
                  <span className="font-normal text-text-subtle">(one highlighted product per category)</span>
                </span>
                {coverOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add products to this category to pick a seller&apos;s choice.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Badges one product in this category as “Seller&apos;s choice”. Pick “None” to clear it.
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setSellersChoiceId(null)}
                        className={`flex aspect-square items-center justify-center rounded-lg border text-center text-[11px] font-medium transition-colors ${
                          sellersChoiceId === null
                            ? 'border-primary bg-muted text-foreground ring-2 ring-ring'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        None
                      </button>
                      {coverOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSellersChoiceId(opt.id)}
                          title={opt.name}
                          aria-pressed={sellersChoiceId === opt.id}
                          className={`relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all ${
                            sellersChoiceId === opt.id
                              ? 'border-primary ring-2 ring-ring'
                              : 'border-border hover:opacity-90'
                          }`}
                        >
                          {opt.heroUrl ? (
                            <Image src={opt.heroUrl} alt={opt.name} fill className="object-cover" sizes="100px" />
                          ) : (
                            <span className="flex h-full items-center justify-center px-1 text-[10px] text-text-subtle">
                              {opt.name}
                            </span>
                          )}
                          {sellersChoiceId === opt.id && (
                            <span className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
