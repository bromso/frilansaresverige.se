import { afterEach, describe, expect, it, jest } from 'bun:test'
import { fetchMemberCount } from '../pages/index'

afterEach(() => {
  jest.restoreAllMocks()
})

describe('fetchMemberCount', () => {
  it('returns a number when the API responds with a numeric body', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ ok: true, text: () => Promise.resolve('2500') }),
      ) as unknown as typeof fetch
    expect(await fetchMemberCount()).toBe(2500)
  })

  it('returns null when the API responds with a non-numeric body', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ ok: true, text: () => Promise.resolve('nope') }),
      ) as unknown as typeof fetch
    expect(await fetchMemberCount()).toBe(null)
  })

  it('returns null when the response is not ok', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ ok: false, text: () => Promise.resolve('') }),
      ) as unknown as typeof fetch
    expect(await fetchMemberCount()).toBe(null)
  })

  it('returns null when the request rejects', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error('timeout')),
      ) as unknown as typeof fetch
    expect(await fetchMemberCount()).toBe(null)
  })
})
