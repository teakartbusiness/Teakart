'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/types'

export default function ProductGallery({ images }: { images: ProductImage[] }) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [activeUrl, setActiveUrl] = useState(sorted[0]?.url ?? '')

  if (sorted.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-muted flex items-center justify-center text-text-subtle text-sm">
        No image
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
        <Image
          src={activeUrl}
          alt="Product image"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {sorted.length > 1 && (
        /* px / py give the ring-2 selection state room to render without
           being clipped by the overflow container (overflow-x:auto forces
           overflow-y to clip per CSS spec). */
        <div className="flex gap-2 overflow-x-auto px-1 py-2">
          {sorted.map((image) => (
            <button
              key={image.public_id}
              type="button"
              onClick={() => setActiveUrl(image.url)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-offset-2 ring-offset-background transition-all ${
                activeUrl === image.url
                  ? 'ring-2 ring-foreground'
                  : 'ring-border hover:ring-border-strong'
              }`}
            >
              <Image
                src={image.url}
                alt="Product thumbnail"
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
