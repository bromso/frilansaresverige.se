import type { NextApiRequest, NextApiResponse } from 'next'
import { HONEYPOT_FIELD } from './form-fields'
import { checkRateLimit } from './rate-limit.server'
import { clientKey } from './slack-form.server'

// Forwards the /api/uppdrag/* routes to the uppdrag service over the
// Docker network. The browser never sees the service: this is where the
// honeypot and per-IP rate limit guard the writes, and the shared key
// means the service refuses anything that did not come through here.

export type ProxyMethod = 'GET' | 'POST' | 'DELETE'

export interface UppdragProxyRoute {
  methods: readonly ProxyMethod[]
  /** Upstream path for this request, or null when the query is invalid. */
  path: (query: NextApiRequest['query']) => string | null
}

export interface ProxyDeps {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  now?: () => number
  log?: (message: string, detail?: unknown) => void
}

export const ASSIGNMENT_ID = /^[A-Z0-9]{16}$/

export const assignmentIdFrom = (
  query: NextApiRequest['query'],
): string | null => {
  const id = query.id
  return typeof id === 'string' && ASSIGNMENT_ID.test(id) ? id : null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const NOT_DELIVERED = 'The submission could not be delivered, please try again'

export function createUppdragProxy(
  route: UppdragProxyRoute,
  {
    env = process.env,
    fetchImpl = fetch,
    now = Date.now,
    log = (message, detail) => console.error(message, detail ?? ''),
  }: ProxyDeps = {},
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const method = (req.method ?? 'GET') as ProxyMethod
    if (!route.methods.includes(method)) {
      res.setHeader('Allow', route.methods.join(', '))
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const path = route.path(req.query)
    if (path === null) {
      res.status(404).json({ success: false, error: 'Not found' })
      return
    }

    const base = env.UPPDRAG_API_URL?.replace(/\/+$/, '')
    const key = env.UPPDRAG_API_KEY
    if (!base || !key) {
      log('UPPDRAG_API_URL or UPPDRAG_API_KEY is not set; refusing the request')
      res.status(500).json({
        success: false,
        error: 'The form is not configured on the server',
      })
      return
    }

    const write = method !== 'GET'
    let body: Record<string, unknown> | undefined
    if (write) {
      if (method === 'POST') {
        // A cross-site HTML form can POST urlencoded data without CORS;
        // the site's own forms always send JSON.
        const contentType = String(req.headers['content-type'] ?? '')
        if (!contentType.toLowerCase().startsWith('application/json')) {
          res.status(415).json({
            success: false,
            error: 'Content-Type must be application/json',
          })
          return
        }
        if (isRecord(req.body)) {
          const { [HONEYPOT_FIELD]: honeypot, ...rest } = req.body
          if (String(honeypot ?? '').trim() !== '') {
            // Bots get a success so they believe it worked.
            res.status(200).json({ success: true })
            return
          }
          body = rest
        }
      }
      if (!checkRateLimit(clientKey(req), undefined, now())) {
        res.setHeader('Retry-After', '600')
        res.status(429).json({
          success: false,
          error: 'Too many submissions, please try again later',
        })
        return
      }
    }

    let upstream: Response
    try {
      upstream = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'X-Forwarded-For': clientKey(req),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        // A timeout throws and lands in the 502 below.
        signal: AbortSignal.timeout(10_000),
      })
    } catch (error) {
      log('The uppdrag service could not be reached', error)
      res.status(502).json({ success: false, error: NOT_DELIVERED })
      return
    }

    const text = await upstream.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      log(
        `Unexpected response from the uppdrag service: ${upstream.status} ${text.slice(0, 200)}`,
      )
      res.status(502).json({ success: false, error: NOT_DELIVERED })
      return
    }
    // A 401 means the shared key is out of step; a 5xx is a service fault.
    // Both pass through to the client, but someone should see them here.
    if (upstream.status === 401 || upstream.status >= 500) {
      log(`The uppdrag service answered ${upstream.status}`)
    }
    res.status(upstream.status).json(payload)
  }
}
