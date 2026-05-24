'use client'

import { Select } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

interface Props {
  value: OrderStatus
  /** Labelled status options visible in the dropdown. */
  options: OrderStatus[]
  onChange: (next: OrderStatus) => void
  disabled?: boolean
  /** Used for the accessible name when the visible value is just "pending" etc. */
  ariaLabel?: string
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg ring-status-pending-ring',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-fg ring-status-confirmed-ring',
  shipped: 'bg-status-shipped-bg text-status-shipped-fg ring-status-shipped-ring',
  delivered: 'bg-status-delivered-bg text-status-delivered-fg ring-status-delivered-ring',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg ring-status-cancelled-ring',
}

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-fg',
  confirmed: 'bg-status-confirmed-fg',
  shipped: 'bg-status-shipped-fg',
  delivered: 'bg-status-delivered-fg',
  cancelled: 'bg-status-cancelled-fg',
}

/**
 * Pill-shaped status dropdown for the admin orders board. Built on radix
 * Select so the open menu is fully themed (background, hover state, options
 * — all pull from the active theme tokens, light or dark). Native <select>
 * can't restyle option items, which is what the customer flagged.
 */
export default function StatusSelect({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: Props) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => onChange(v as OrderStatus)}
      disabled={disabled}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset transition-opacity focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70',
          STATUS_STYLES[value],
        )}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-3 opacity-70" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt}
                value={opt}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm capitalize text-foreground outline-none transition-colors',
                  'data-[highlighted]:bg-muted data-[highlighted]:text-foreground',
                  'data-[state=checked]:font-medium',
                )}
              >
                <span
                  aria-hidden
                  className={cn('inline-block size-2 rounded-full', STATUS_DOT[opt])}
                />
                <Select.ItemText>{opt}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check className="size-4 text-foreground" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
