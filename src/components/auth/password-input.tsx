'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Props {
  id: string
  value: string
  onChange: (next: string) => void
  visible: boolean
  onVisibleChange: (next: boolean) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  minLength?: number
}

/**
 * Password text input with an inline show/hide toggle. Visibility is
 * controlled by the parent so the "Generate password" button can reveal
 * the just-generated value automatically.
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  visible,
  onVisibleChange,
  autoComplete = 'new-password',
  placeholder = '••••••••••',
  required = true,
  minLength,
}: Props) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => onVisibleChange(!visible)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
