'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/types'

type Item = {
  id: string
  product?: { name?: string; images?: ProductImage[] | null } | null
}

type Hero = { itemId: string; url: string; alt: string }

function pickHero(item: Item): Hero | null {
  const images = item.product?.images ?? []
  const hero = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]
  if (!hero?.url) return null
  return { itemId: item.id, url: hero.url, alt: item.product?.name ?? 'Product' }
}

/**
 * Square hero block for an order.
 *
 *   1 item   → static image (no controls — nothing to cycle through).
 *   2+ items → auto-advancing slideshow with dot indicators. Hover/focus
 *              pauses the timer. Click a dot to jump.
 *
 * Used on /account/orders/[id] and on the post-payment /order/[orderId].
 */
const SLIDE_INTERVAL_MS = 3500

const DEFAULT_WRAPPER = 'relative aspect-square w-full bg-muted'

export default function OrderHeroImages({
  items,
  imageWrapperClassName = DEFAULT_WRAPPER,
}: {
  items: Item[]
  imageWrapperClassName?: string
}) {
  const heroes = items
    .map((it) => pickHero(it))
    .filter((h): h is Hero => h !== null)

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (heroes.length < 2 || paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % heroes.length)
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [heroes.length, paused])

  if (heroes.length === 0) {
    return <div className={imageWrapperClassName} />
  }

  if (heroes.length === 1) {
    const hero = heroes[0]
    return (
      <div className={imageWrapperClassName}>
        <Image
          src={hero.url}
          alt={hero.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4 sm:p-6"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        className={imageWrapperClassName}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {heroes.map((hero, i) => (
          <div
            key={hero.itemId}
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={hero.url}
              alt={hero.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4 sm:p-6"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-3">
        {heroes.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show item ${i + 1} of ${heroes.length}`}
            onClick={() => setIndex(i)}
            className={`size-2 rounded-full transition-all duration-150 ease-out ${
              i === index
                ? 'w-5 bg-foreground'
                : 'bg-foreground/30 hover:bg-foreground/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
