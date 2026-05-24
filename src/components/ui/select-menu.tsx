'use client'

import { Select } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string }

/**
 * Rounded, fully-themed dropdown built on radix Select. Unlike a native
 * <select>, the open menu is a rounded popover (matching the trigger) with a
 * subtle focus state — no harsh browser rectangle / strong outline.
 */
export default function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-3 pr-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus:outline-none data-[state=open]:border-border-strong data-[state=open]:rounded-b-none',
          className,
        )}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={0}
          className="z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-b-lg border border-t-0 border-border-strong bg-popover text-popover-foreground shadow-lg"
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-sm text-foreground outline-none transition-colors',
                  'data-[highlighted]:bg-muted data-[state=checked]:font-medium',
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
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
