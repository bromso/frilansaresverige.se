import { describe, expect, it, jest } from 'bun:test'
import type { BunRequest } from 'bun'
import type { AssignmentHandlers } from './assignments'
import { createRoutes } from './server'

const KEY = 'secret'

// Bun fills params from the route pattern; here they are supplied by hand.
const request = <P extends string>(
  url: string,
  init: RequestInit & { params?: Record<string, string> } = {},
) => {
  const { params = {}, ...rest } = init
  return Object.assign(new Request(url, rest), {
    params,
  }) as unknown as BunRequest<P>
}

const handlers: AssignmentHandlers = {
  create: jest.fn(async () =>
    Response.json({ success: true, id: 'X' }, { status: 201 }),
  ),
  get: jest.fn(async (id: string) => Response.json({ id })),
  remove: jest.fn(async () => Response.json({ success: true })),
  listComments: jest.fn(async () => Response.json([])),
  createComment: jest.fn(async () =>
    Response.json({ success: true }, { status: 201 }),
  ),
}

const build = (healthy = true, count: number | null = 4200) =>
  createRoutes({
    config: { apiKey: KEY, siteUrl: 'https://frilansaresverige.se' },
    handlers,
    isHealthy: async () => healthy,
    memberCount: () => count,
  })

const auth = { Authorization: `Bearer ${KEY}` }

describe('createRoutes', () => {
  it('rejects assignment calls without the key', async () => {
    const routes = build()
    const response = await routes['/api/assignments/:id'].GET(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', {
        params: { id: 'ABC' },
      }),
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Unauthorized',
    })
    const wrong = await routes['/api/assignments'].POST(
      request<'/api/assignments'>('http://x/api/assignments', {
        method: 'POST',
        headers: { Authorization: 'Bearer nope' },
      }),
    )
    expect(wrong.status).toBe(401)
    expect(handlers.get).not.toHaveBeenCalled()
  })

  it('dispatches authorised calls with the route params', async () => {
    const routes = build()
    await routes['/api/assignments/:id'].GET(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', {
        params: { id: 'ABC' },
        headers: auth,
      }),
    )
    expect(handlers.get).toHaveBeenCalledWith('ABC')
    await routes['/api/assignments/:id'].DELETE(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', {
        method: 'DELETE',
        params: { id: 'ABC' },
        headers: auth,
      }),
    )
    expect(handlers.remove).toHaveBeenCalledWith('ABC')
    await routes['/api/assignments/:id/comments'].GET(
      request<'/api/assignments/:id/comments'>(
        'http://x/api/assignments/ABC/comments',
        { params: { id: 'ABC' }, headers: auth },
      ),
    )
    expect(handlers.listComments).toHaveBeenCalledWith('ABC')
    const req = request<'/api/assignments/:id/comments'>(
      'http://x/api/assignments/ABC/comments',
      {
        method: 'POST',
        params: { id: 'ABC' },
        headers: auth,
      },
    )
    await routes['/api/assignments/:id/comments'].POST(req)
    expect(handlers.createComment).toHaveBeenCalledWith('ABC', req)
    const created = await routes['/api/assignments'].POST(
      request<'/api/assignments'>('http://x/api/assignments', {
        method: 'POST',
        headers: auth,
      }),
    )
    expect(created.status).toBe(201)
  })

  it('reports health from the database', async () => {
    expect((await build(true)['/api/health'].GET()).status).toBe(200)
    expect((await build(false)['/api/health'].GET()).status).toBe(500)
  })

  it('serves the member count as text, 503 before the first refresh', async () => {
    const ok = await build(true, 4200)['/api/member-count'].GET()
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toStartWith('text/plain')
    expect(await ok.text()).toBe('4200')
    expect((await build(true, null)['/api/member-count'].GET()).status).toBe(
      503,
    )
  })

  it('redirects old edit links and the root to the site', async () => {
    const routes = build()
    const edit = routes['/assignments/:id'].GET(
      request<'/assignments/:id'>('http://x/assignments/ABC', {
        params: { id: 'ABC' },
      }),
    )
    expect(edit.status).toBe(301)
    expect(edit.headers.get('location')).toBe(
      'https://frilansaresverige.se/tipsa/hantera/ABC',
    )
    const root = routes['/'].GET()
    expect(root.status).toBe(301)
    expect(root.headers.get('location')).toBe(
      'https://frilansaresverige.se/tipsa',
    )
  })
})
