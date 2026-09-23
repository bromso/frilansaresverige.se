import { beforeEach, describe, expect, it, jest } from 'bun:test'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  assignmentIdFrom,
  createGigProxy,
  type GigProxyRoute,
} from './gig-proxy.server'
import { resetRateLimit } from './rate-limit.server'

const env = { GIG_API_URL: 'http://gig:8989/', GIG_API_KEY: 'k' }

const makeReq = (
  overrides: Partial<{
    method: string
    body: unknown
    query: Record<string, string>
    headers: Record<string, string>
  }> = {},
) =>
  ({
    method: overrides.method ?? 'POST',
    body: overrides.body,
    query: overrides.query ?? {},
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      ...overrides.headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as NextApiRequest

const makeRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(key: string, value: string) {
      res.headers[key] = value
      return res
    },
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
  }
  return res as typeof res & NextApiResponse
}

const upstream = (status: number, body: string) =>
  jest.fn(async () => new Response(body, { status })) as unknown as jest.Mock

const create = { methods: ['POST'] as const, path: () => '/api/assignments' }
const byId = {
  methods: ['GET', 'DELETE'] as const,
  path: (query: NextApiRequest['query']) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}`
  },
}

describe('assignmentIdFrom', () => {
  it('accepts only 16 uppercase alphanumerics', () => {
    expect(assignmentIdFrom({ id: 'ABCDEFGHIJKLMNOP' })).toBe(
      'ABCDEFGHIJKLMNOP',
    )
    expect(assignmentIdFrom({ id: 'abc' })).toBeNull()
    expect(assignmentIdFrom({ id: ['A', 'B'] })).toBeNull()
    expect(assignmentIdFrom({})).toBeNull()
  })
})

describe('createGigProxy', () => {
  beforeEach(() => resetRateLimit())

  const build = (
    route: GigProxyRoute = create,
    fetchImpl = upstream(201, '{"success":true,"id":"X"}'),
    overrides = {},
  ) => ({
    handler: createGigProxy(route, {
      env: { ...env, ...overrides },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      log: () => {},
    }),
    fetchImpl,
  })

  it('rejects methods the route does not list', async () => {
    const { handler, fetchImpl } = build(byId)
    const res = makeRes()
    await handler(
      makeReq({ method: 'POST', query: { id: 'ABCDEFGHIJKLMNOP' } }),
      res,
    )
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('GET, DELETE')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('404s an invalid id before calling upstream', async () => {
    const { handler, fetchImpl } = build(byId)
    const res = makeRes()
    await handler(makeReq({ method: 'GET', query: { id: 'nope' } }), res)
    expect(res.statusCode).toBe(404)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('500s when the service is not configured', async () => {
    const { handler, fetchImpl } = build(create, undefined, {
      GIG_API_KEY: '',
    })
    const res = makeRes()
    await handler(makeReq({ body: {} }), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      success: false,
      error: 'The form is not configured on the server',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('requires JSON on POST, swallows the honeypot and rate-limits writes', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ headers: { 'content-type': 'text/plain' } }), res)
    expect(res.statusCode).toBe(415)

    const trap = makeRes()
    await handler(makeReq({ body: { website: 'http://spam' } }), trap)
    expect(trap.statusCode).toBe(200)
    expect(trap.body).toEqual({ success: true })
    expect(fetchImpl).not.toHaveBeenCalled()

    for (let i = 0; i < 5; i++) {
      await handler(makeReq({ body: { title: 'x' } }), makeRes())
    }
    const limited = makeRes()
    await handler(makeReq({ body: { title: 'x' } }), limited)
    expect(limited.statusCode).toBe(429)
    expect(limited.headers['Retry-After']).toBe('600')
  })

  it('forwards with the key and client ip, passing status and body through', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ body: { title: 'x', website: '' } }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ success: true, id: 'X' })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://gig:8989/api/assignments')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer k')
    expect(init.headers['X-Forwarded-For']).toBe('203.0.113.1')
    expect(JSON.parse(init.body)).toEqual({ title: 'x' })
  })

  it('forwards GET without a body and does not rate-limit it', async () => {
    const fetchImpl = upstream(200, '{"id":"ABCDEFGHIJKLMNOP","deleted":false}')
    const { handler } = build(byId, fetchImpl)
    for (let i = 0; i < 7; i++) {
      const res = makeRes()
      await handler(
        makeReq({ method: 'GET', query: { id: 'ABCDEFGHIJKLMNOP' } }),
        res,
      )
      expect(res.statusCode).toBe(200)
    }
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://gig:8989/api/assignments/ABCDEFGHIJKLMNOP')
    expect(init.body).toBeUndefined()
  })

  it('passes upstream errors through and 502s when unreachable or non-JSON', async () => {
    const { handler } = build(
      create,
      upstream(400, '{"success":false,"error":"Titel is required"}'),
    )
    const res = makeRes()
    await handler(makeReq({ body: { title: '' } }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, error: 'Titel is required' })

    const down = createGigProxy(create, {
      env,
      fetchImpl: (async () => {
        throw new Error('ECONNREFUSED')
      }) as unknown as typeof fetch,
      log: () => {},
    })
    const downRes = makeRes()
    await down(makeReq({ body: { title: 'x' } }), downRes)
    expect(downRes.statusCode).toBe(502)

    const { handler: html } = build(create, upstream(500, '<html>oops</html>'))
    const htmlRes = makeRes()
    await html(makeReq({ body: { title: 'x' } }), htmlRes)
    expect(htmlRes.statusCode).toBe(502)
    expect(htmlRes.body).toMatchObject({ success: false })
  })

  it('passes a 401 through and logs it', async () => {
    const log = jest.fn()
    const handler = createGigProxy(create, {
      env,
      fetchImpl: upstream(
        401,
        '{"success":false,"error":"Unauthorized"}',
      ) as unknown as typeof fetch,
      log,
    })
    const res = makeRes()
    await handler(makeReq({ body: { title: 'x' } }), res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, error: 'Unauthorized' })
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toBe('The gig service answered 401')
  })
})
