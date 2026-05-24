/**
 * Server-side input validation for product create / update API routes.
 * Each helper either returns the cleaned value or an `{ error }` object so
 * callers can short-circuit with a 400 response.
 */

import type { AttributeEntry, ProductImage, Variant } from '@/types'

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const PRODUCT_LIMITS = {
  name: 200,
  description: 5000,
  price: 10_000_000,
  variants: 20,
  attributes: 50,
  images: 30,
}

export function validateVariants(input: unknown): Variant[] | { error: string } {
  if (!Array.isArray(input)) return { error: 'variants must be an array' }
  if (input.length > PRODUCT_LIMITS.variants) {
    return { error: `Too many variants (max ${PRODUCT_LIMITS.variants})` }
  }
  const out: Variant[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Each variant must be an object' }
    const v = raw as Record<string, unknown>
    const label = typeof v.label === 'string' ? v.label.trim() : ''
    const price = typeof v.price === 'number' ? v.price : NaN
    const position = typeof v.position === 'number' ? v.position : 0
    if (!label) return { error: 'Variant label is required' }
    if (label.length > 100) return { error: 'Variant label is too long' }
    if (!Number.isFinite(price) || price < 0 || price > PRODUCT_LIMITS.price) {
      return { error: 'Variant price is invalid' }
    }
    out.push({ label, price, position })
  }
  return out
}

export function validateAttributes(input: unknown): AttributeEntry[] | { error: string } {
  if (!Array.isArray(input)) return { error: 'attributes must be an array' }
  if (input.length > PRODUCT_LIMITS.attributes) {
    return { error: `Too many attributes (max ${PRODUCT_LIMITS.attributes})` }
  }
  const out: AttributeEntry[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Each attribute must be an object' }
    const a = raw as Record<string, unknown>
    const key = typeof a.key === 'string' ? a.key.trim() : ''
    const value = typeof a.value === 'string' ? a.value : ''
    const position = typeof a.position === 'number' ? a.position : 0
    if (!key) continue // skip blank rows (UI lets users add then delete)
    if (key.length > 100 || value.length > 500) return { error: 'Attribute is too long' }
    out.push({ key, value, position })
  }
  return out
}

export function validateImages(input: unknown): ProductImage[] | { error: string } {
  if (!Array.isArray(input)) return { error: 'images must be an array' }
  if (input.length > PRODUCT_LIMITS.images) {
    return { error: `Too many images (max ${PRODUCT_LIMITS.images})` }
  }
  const out: ProductImage[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Each image must be an object' }
    const i = raw as Record<string, unknown>
    const url = typeof i.url === 'string' ? i.url : ''
    const public_id = typeof i.public_id === 'string' ? i.public_id : ''
    const position = typeof i.position === 'number' ? i.position : 0
    // Only allow Cloudinary URLs — prevents arbitrary remote content from being
    // stored as a "product image" and later rendered on the storefront.
    if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) {
      return { error: 'Image URL must be served from Cloudinary' }
    }
    if (!public_id) return { error: 'Image public_id is required' }
    if (url.length > 1000 || public_id.length > 500) return { error: 'Image URL too long' }
    out.push({ url, public_id, position })
  }
  return out
}
