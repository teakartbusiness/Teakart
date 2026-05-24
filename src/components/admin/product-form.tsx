'use client'

import { useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { AttributeEntry, Product, Category, Variant, ProductImage } from '@/types'
import CloudinaryUploader from './cloudinary-uploader'
import VariantEditor from './variant-editor'

interface Props {
  product?: Product
  categories: Category[]
  onSuccess: () => void
  /** Render the submit button externally (e.g. in a dialog footer). */
  renderActionsInline?: boolean
}

type AttributeRow = { key: string; value: string }

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Read attributes from a product. Handles both the new array-of-entries shape
 * and the legacy object shape (for products created before the migration).
 */
function readAttributes(attrs: unknown): AttributeRow[] {
  if (Array.isArray(attrs)) {
    return [...(attrs as AttributeEntry[])]
      .sort((a, b) => a.position - b.position)
      .map(({ key, value }) => ({ key, value: String(value ?? '') }))
  }
  if (attrs && typeof attrs === 'object') {
    return Object.entries(attrs as Record<string, unknown>).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
  }
  return []
}

function rowsToAttributes(rows: AttributeRow[]): AttributeEntry[] {
  return rows
    .filter((row) => row.key.trim())
    .map((row, index) => ({
      key: row.key.trim(),
      value: row.value,
      position: index,
    }))
}

export default function ProductForm({ product, categories, onSuccess, renderActionsInline = true }: Props) {
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [description, setDescription] = useState(product?.description ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [price, setPrice] = useState<string>(
    product?.price !== undefined ? String(product.price) : ''
  )
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [])
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? [])
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    readAttributes(product?.attributes)
  )
  const dragIndexRef = useRef<number | null>(null)

  // Last attribute row's key input — used to focus + scroll-into-view the
  // just-added row so the user doesn't have to hunt for it at the bottom
  // of a long scrollable dialog.
  const lastAttrInputRef = useRef<HTMLInputElement | null>(null)
  const [attrJustAdded, setAttrJustAdded] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!attrJustAdded) return
    setAttrJustAdded(false)
    const input = lastAttrInputRef.current
    if (!input) return
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input.focus()
  }, [attrJustAdded])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(value)
  }

  function updateAttribute(index: number, field: 'key' | 'value', value: string) {
    setAttributes((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  function addAttribute() {
    setAttributes((rows) => [...rows, { key: '', value: '' }])
    setAttrJustAdded(true)
  }

  function handleAttributeDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleAttributeDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault()
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === overIndex) return
    setAttributes((rows) => {
      const reordered = [...rows]
      const [moved] = reordered.splice(dragIndex, 1)
      reordered.splice(overIndex, 0, moved)
      dragIndexRef.current = overIndex
      return reordered
    })
  }

  function handleAttributeDragEnd() {
    dragIndexRef.current = null
  }

  function removeAttribute(index: number) {
    setAttributes((rows) => rows.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required'
    if (!slug.trim()) next.slug = 'Slug is required'
    else if (!/^[a-z0-9-]+$/.test(slug)) next.slug = 'Use lowercase letters, numbers, and hyphens only'
    if (!categoryId) next.category = 'Category is required'
    const priceNum = parseFloat(price)
    if (!price || isNaN(priceNum) || priceNum < 0) next.price = 'Valid price is required'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      category_id: categoryId,
      variants,
      attributes: rowsToAttributes(attributes),
      ...(isEdit ? { images } : {}),
    }

    const url = isEdit ? `/api/products/${product!.id}` : '/api/products'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Request failed' }))
      toast.error(error ?? 'Request failed')
      setSubmitting(false)
      return
    }

    if (!isEdit) {
      const created = await res.json() as Product
      if (images.length > 0) {
        await fetch(`/api/products/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images }),
        })
      }
    }

    toast.success(isEdit ? 'Product updated.' : 'Product created.')
    setSubmitting(false)
    onSuccess()
  }

  return (
    <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring font-mono text-sm"
        />
        {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step={0.01}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Variants</label>
        <VariantEditor variants={variants} onChange={setVariants} />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Images</label>
        <CloudinaryUploader images={images} onChange={setImages} />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Attributes</label>
          {attributes.length > 1 && (
            <span className="text-xs text-muted-foreground">Drag the handle to reorder</span>
          )}
        </div>
        <div className="space-y-2">
          {attributes.map((row, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleAttributeDragStart(index)}
              onDragOver={(e) => handleAttributeDragOver(e, index)}
              onDragEnd={handleAttributeDragEnd}
              className="flex items-center gap-2 rounded-md border border-transparent bg-card hover:border-border"
            >
              <span
                className="cursor-grab text-text-subtle hover:text-muted-foreground active:cursor-grabbing px-1"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </span>
              <input
                ref={index === attributes.length - 1 ? lastAttrInputRef : null}
                type="text"
                placeholder="Key"
                value={row.key}
                onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Value"
                value={row.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="text-destructive hover:text-destructive px-1 text-lg leading-none"
                aria-label="Remove attribute"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAttribute}
            className="text-sm text-muted-foreground hover:text-foreground border border-dashed border-input rounded-md px-3 py-1.5 w-full hover:border-border-strong transition-colors"
          >
            + Add attribute
          </button>
        </div>
      </div>

      {renderActionsInline && (
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      )}
    </form>
  )
}
