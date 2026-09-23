import { beforeEach, describe, expect, it, jest } from 'bun:test'
import type { NextApiRequest, NextApiResponse } from 'next'
import { checkRateLimit, resetRateLimit } from './rate-limit.server'
import {
  createSlackFormHandler,
  escapeInline,
  escapeMrkdwn,
  HONEYPOT_FIELD,
  postSlackMessage,
  readFields,
} from './slack-form.server'

describe('escapeMrkdwn', () => {
  it('neutralises the three mrkdwn control characters', () => {
    expect(escapeMrkdwn('<!channel> a & b <https://x|y>')).toBe(
      '&lt;!channel&gt; a &amp; b &lt;https://x|y&gt;',
    )
  })

  it('drops control characters but keeps newlines and tabs', () => {
    expect(escapeMrkdwn('a\u0000b\u001bc\n\td')).toBe('abc\n\td')
  })

  it('collapses newlines for inline fields', () => {
    expect(escapeInline('Namn:\nEmail: forged@example.com')).toBe(
      'Namn: Email: forged@example.com',
    )
  })
})

describe('readFields', () => {
  const rules = {
    title: { label: 'Title', required: true, max: 10 },
    email: { label: 'Email', required: true, max: 50, pattern: /@/ },
    note: { label: 'Note', max: 5 },
    relation: { label: 'Relation', oneOf: ['a', 'b'] as const, max: 5 },
  }

  it('rejects non-object bodies', () => {
    expect(readFields(undefined, rules)).toEqual({
      ok: false,
      error: 'Request body must be a JSON object',
    })
    expect(readFields('', rules).ok).toBe(false)
    expect(readFields([], rules).ok).toBe(false)
  })

  it('trims and returns every declared field, empty when absent', () => {
    const result = readFields({ title: ' Hej ', email: 'a@b' }, rules)
    expect(result).toEqual({
      ok: true,
      fields: { title: 'Hej', email: 'a@b', note: '', relation: '' },
    })
  })

  it('names the offending field', () => {
    expect(readFields({ email: 'a@b' }, rules)).toEqual({
      ok: false,
      error: 'Title is required',
    })
    expect(readFields({ title: 'x'.repeat(11), email: 'a@b' }, rules)).toEqual({
      ok: false,
      error: 'Title must be at most 10 characters',
    })
    expect(readFields({ title: 'x', email: 'nope' }, rules)).toEqual({
      ok: false,
      error: 'Email has an invalid format',
    })
    expect(
      readFields({ title: 'x', email: 'a@b', relation: 'zz' }, rules),
    ).toEqual({ ok: false, error: 'Relation has an unknown value' })
    expect(readFields({ title: 42, email: 'a@b' }, rules)).toEqual({
      ok: false,
      error: 'Title must be a string',
    })
  })
})

describe('postSlackMessage', () => {
  const message = { username: 'u', icon_emoji: ':x:', text: 't' }

  const fakeFetch = (status: number, body: string) =>
    jest.fn(
      async () => new Response(body, { status }),
    ) as unknown as typeof fetch

  it('resolves when Slack answers ok', async () => {
    const fetchImpl = fakeFetch(200, 'ok')
    await postSlackMessage('https://hooks.example/x', message, fetchImpl)
    const [url, init] = (fetchImpl as unknown as jest.Mock).mock.calls[0]
    expect(url).toBe('https://hooks.example/x')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual(message)
  })

  it('throws on a non-2xx status or a non-ok body', async () => {
    await expect(
      postSlackMessage('https://h', message, fakeFetch(404, 'no_service')),
    ).rejects.toThrow('404 no_service')
    await expect(
      postSlackMessage('https://h', message, fakeFetch(200, 'invalid')),
    ).rejects.toThrow('200 invalid')
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => resetRateLimit())

  it('allows `limit` hits per window and then refuses until it slides', () => {
    const opts = { limit: 2, windowMs: 1000 }
    expect(checkRateLimit('ip', opts, 0)).toBe(true)
    expect(checkRateLimit('ip', opts, 10)).toBe(true)
    expect(checkRateLimit('ip', opts, 20)).toBe(false)
    expect(checkRateLimit('other', opts, 20)).toBe(true)
    expect(checkRateLimit('ip', opts, 1001)).toBe(true)
  })
})

describe('createSlackFormHandler', () => {
  beforeEach(() => resetRateLimit())

  const route = {
    webhookEnv: 'TEST_WEBHOOK',
    username: 'Test',
    icon_emoji: ':test:',
    rules: {
      name: { label: 'Name', required: true, max: 50 },
      note: { label: 'Note', max: 500 },
    },
    formatText: (f: Record<'name' | 'note', string>) =>
      `Namn: ${escapeInline(f.name)}\nNotering: ${escapeMrkdwn(f.note)}`,
  }

  const makeReq = (
    overrides: Partial<{
      method: string
      body: unknown
      headers: Record<string, string>
      ip: string
    }> = {},
  ) =>
    ({
      method: overrides.method ?? 'POST',
      body: overrides.body,
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': overrides.ip ?? '203.0.113.1',
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

  const okFetch = () =>
    jest.fn(
      async () => new Response('ok', { status: 200 }),
    ) as unknown as jest.Mock

  const build = (fetchImpl = okFetch(), env = { TEST_WEBHOOK: 'https://h' }) =>
    ({
      handler: createSlackFormHandler(route, {
        env,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        log: () => {},
      }),
      fetchImpl,
    }) as const

  it('rejects anything but POST', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects non-JSON content types', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(
      makeReq({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: { name: 'x' },
      }),
      res,
    )
    expect(res.statusCode).toBe(415)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('answers 500 when the webhook is not configured', async () => {
    const { handler, fetchImpl } = build(okFetch(), {} as never)
    const res = makeRes()
    await handler(makeReq({ body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(500)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('answers 400 with the field name on invalid input', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ body: {} }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, error: 'Name is required' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('pretends to succeed when the honeypot is filled', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(
      makeReq({ body: { name: 'bot', [HONEYPOT_FIELD]: 'http://spam' } }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ success: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts the escaped message and reports success', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(
      makeReq({ body: { name: '<!channel> Anna', note: 'a & b\nc' } }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ success: true })
    const init = fetchImpl.mock.calls[0][1]
    expect(JSON.parse(init.body)).toEqual({
      username: 'Test',
      icon_emoji: ':test:',
      text: 'Namn: &lt;!channel&gt; Anna\nNotering: a &amp; b\nc',
    })
  })

  it('answers 502 when Slack rejects the message', async () => {
    const rejecting = jest.fn(
      async () => new Response('no_service', { status: 404 }),
    ) as unknown as jest.Mock
    const { handler } = build(rejecting)
    const res = makeRes()
    await handler(makeReq({ body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({
      success: false,
      error: 'The submission could not be delivered, please try again',
    })
  })

  it('answers 502 when the network fails', async () => {
    const failing = jest.fn(async () => {
      throw new Error('ECONNRESET')
    }) as unknown as jest.Mock
    const { handler } = build(failing)
    const res = makeRes()
    await handler(makeReq({ body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(502)
  })

  it('rate limits per client address', async () => {
    const { handler, fetchImpl } = build()
    for (let i = 0; i < 5; i++) {
      const res = makeRes()
      await handler(makeReq({ body: { name: 'x' } }), res)
      expect(res.statusCode).toBe(200)
    }
    const res = makeRes()
    await handler(makeReq({ body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['Retry-After']).toBe('600')
    expect(fetchImpl).toHaveBeenCalledTimes(5)

    const other = makeRes()
    await handler(makeReq({ body: { name: 'x' }, ip: '198.51.100.7' }), other)
    expect(other.statusCode).toBe(200)
  })
})
