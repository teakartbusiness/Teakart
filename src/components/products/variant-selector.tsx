'use client'

import type { Variant } from '@/types'

type Props = {
  variants: Variant[]
  selected: Variant | null
  onSelect: (variant: Variant) => void
}

export default function VariantSelector({ variants, selected, onSelect }: Props) {
  const sorted = [...variants].sort((a, b) => a.position - b.position)

  if (sorted.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Size
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((variant) => {
          const isSelected =
            selected?.label === variant.label && selected?.position === variant.position

          return (
            <button
              key={`${variant.label}-${variant.position}`}
              type="button"
              onClick={() => onSelect(variant)}
              className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
                isSelected
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-border-strong hover:bg-muted'
              }`}
            >
              <span className="font-medium">{variant.label}</span>
              <span className="ml-2 tabular-nums opacity-80">₹{variant.price.toLocaleString('en-IN')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
