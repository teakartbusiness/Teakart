'use client'

import { useRef } from 'react'
import type { Variant } from '@/types'

interface Props {
  variants: Variant[]
  onChange: (variants: Variant[]) => void
}

export default function VariantEditor({ variants, onChange }: Props) {
  const dragIndex = useRef<number | null>(null)

  const sorted = [...variants].sort((a, b) => a.position - b.position)

  function update(index: number, field: 'label' | 'price', value: string) {
    const updated = sorted.map((v, i) =>
      i === index
        ? { ...v, [field]: field === 'price' ? parseFloat(value) || 0 : value }
        : v
    )
    onChange(updated)
  }

  function remove(index: number) {
    const updated = sorted
      .filter((_, i) => i !== index)
      .map((v, i) => ({ ...v, position: i }))
    onChange(updated)
  }

  function addVariant() {
    onChange([...sorted, { label: '', price: 0, position: sorted.length }])
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    onChange(reordered.map((v, i) => ({ ...v, position: i })))
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  return (
    <div className="space-y-2">
      {sorted.map((variant, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className="flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-grab active:cursor-grabbing"
        >
          <span className="text-text-subtle select-none px-1" aria-hidden>⠿</span>

          <input
            type="text"
            placeholder="Label (e.g. Small)"
            value={variant.label}
            onChange={(e) => update(index, 'label', e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <input
            type="number"
            placeholder="Price"
            value={variant.price === 0 ? '' : variant.price}
            min={0}
            step={0.01}
            onChange={(e) => update(index, 'price', e.target.value)}
            className="w-28 px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <button
            type="button"
            onClick={() => remove(index)}
            className="text-destructive hover:text-destructive px-1 text-lg leading-none"
            aria-label="Remove variant"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addVariant}
        className="text-sm text-muted-foreground hover:text-foreground border border-dashed border-input rounded-md px-3 py-1.5 w-full hover:border-border-strong transition-colors"
      >
        + Add variant
      </button>
    </div>
  )
}
