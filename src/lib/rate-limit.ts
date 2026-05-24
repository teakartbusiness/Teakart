import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

/**
 * Per-route token-bucket rate limiting backed by Upstash Redis.
 *
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable. If either
 * env var is missing (e.g. local dev) the limiter becomes a no-op so the
 * route still works — call sites don't need to special-case anything.
 *
 * Designed to be import-cheap: Redis client is created lazily once per
 * process and limiters are cached so we don't re-instantiate per request.
 */

interface RateLimitOptions {
  /** Cache key — also the Redis prefix so different limits don't share buckets. */
  name: string
  /** Total requests allowed in the window (e.g. 20). */
  requests: number
  /** Window length as an `@upstash/ratelimit` duration string (e.g. '1 m', '10 s'). */
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
}

let redis: Redis | null | undefined
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redis = null
    return null
  }
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(opts: RateLimitOptions): Ratelimit | null {
  const cached = limiters.get(opts.name)
  if (cached) return cached
  const r = getRedis()
  if (!r) return null
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(opts.requests, opts.window),
    analytics: false,
    prefix: `tk:rl:${opts.name}`,
  })
  limiters.set(opts.name, limiter)
  return limiter
}

/**
 * Best-effort client identifier. Prefers Vercel's forwarded-IP header,
 * falls back to other common headers, then to the IP the request came in on.
 * Returns null in environments where no header is set (only in local dev
 * without a proxy, which is fine since the limiter degrades to no-op
 * there too).
 */
function getClientKey(request: NextRequest, userId?: string | null): string {
  if (userId) return `u:${userId}`
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (fwd) return `ip:${fwd}`
  const real = request.headers.get('x-real-ip')
  if (real) return `ip:${real}`
  return 'ip:unknown'
}

/**
 * Apply a limit. Returns `{ ok: true }` to proceed, or `{ ok: false, retryAfter }`
 * to short-circuit. The caller decides how to respond (typically a 429).
 *
 * Falls open (returns ok:true) when Upstash isn't configured, so this can be
 * sprinkled across routes without breaking local dev.
 */
export async function checkRateLimit(
  request: NextRequest,
  opts: RateLimitOptions,
  userId?: string | null,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const limiter = getLimiter(opts)
  if (!limiter) return { ok: true }

  const key = getClientKey(request, userId)
  try {
    const result = await limiter.limit(key)
    if (result.success) return { ok: true }
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    return { ok: false, retryAfter }
  } catch (err) {
    // Don't block legitimate traffic if Upstash is briefly unreachable.
    console.warn('[rate-limit] backend error, falling open:', err)
    return { ok: true }
  }
}

import { NextResponse } from 'next/server'

/** Convenience: turn a `checkRateLimit` failure into a standard 429 response. */
export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'Too many requests — please slow down and try again.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  )
}
