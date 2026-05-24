'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  images: string[]
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
}

/**
 * Shared fullscreen image viewer with prev/next + keyboard nav + body-scroll
 * lock. Used by both the product reviews surface and the support-ticket
 * thread; if you find yourself adding a third caller, keep it generic
 * rather than special-casing.
 */
export function ImageLightbox({ images, index, onClose, onIndexChange }: Props) {
  const next = useCallback(
    () => onIndexChange((index + 1) % images.length),
    [images.length, index, onIndexChange],
  )
  const prev = useCallback(
    () => onIndexChange((index - 1 + images.length) % images.length),
    [images.length, index, onIndexChange],
  )

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose, next, prev])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const url = images[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors duration-150 ease-out hover:bg-background"
      >
        <X className="size-5" />
      </button>

      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium tabular-nums text-foreground">
        {index + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          aria-label="Previous image"
          className="absolute left-3 inline-flex size-12 items-center justify-center rounded-full bg-background/90 text-foreground transition-all duration-150 ease-out hover:bg-background active:scale-95 sm:left-6"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <div
        className="relative h-full w-full max-h-[85vh] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={url}
          alt={`Image ${index + 1}`}
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          aria-label="Next image"
          className="absolute right-3 inline-flex size-12 items-center justify-center rounded-full bg-background/90 text-foreground transition-all duration-150 ease-out hover:bg-background active:scale-95 sm:right-6"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  )
}

/**
 * Convenience hook that owns the open/closed state. Keeps each caller from
 * re-implementing the same controlled-state plumbing.
 */
export function useImageLightbox() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return {
    openIndex,
    isOpen: openIndex !== null,
    open: (i: number) => setOpenIndex(i),
    close: () => setOpenIndex(null),
    setIndex: (i: number) => setOpenIndex(i),
  }
}
