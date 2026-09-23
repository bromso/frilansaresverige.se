// Small in-memory sliding-window rate limiter for the form API routes.
//
// The site runs as a single standalone Node process, so a process-local
// Map is enough to stop a curl loop from flooding the Slack channel. It
// is deliberately not persistent: a restart forgets everything, which is
// fine for abuse control on two low-traffic forms. Anything heavier
// (Turnstile, a proxy-level limit) can be layered on top later.

const hits = new Map<string, number[]>()

export interface RateLimitOptions {
  /** How many requests are allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export const FORM_RATE_LIMIT: RateLimitOptions = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
}

/**
 * Records a hit for `key` and reports whether it is still within the
 * allowance. Old entries are pruned on every call so the map does not
 * grow with the number of distinct clients seen since start-up.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions = FORM_RATE_LIMIT,
  now: number = Date.now(),
): boolean {
  const cutoff = now - windowMs

  for (const [k, stamps] of hits) {
    const fresh = stamps.filter((t) => t > cutoff)
    if (fresh.length === 0) {
      hits.delete(k)
    } else if (fresh.length !== stamps.length) {
      hits.set(k, fresh)
    }
  }

  const recent = hits.get(key) ?? []
  if (recent.length >= limit) {
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/** Test hook: forget every recorded hit. */
export function resetRateLimit(): void {
  hits.clear()
}
