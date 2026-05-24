'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label?: string
  className?: string
}

export default function BackButton({ label = 'Back', className }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  )
}
