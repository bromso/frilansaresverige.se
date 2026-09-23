import { afterEach, describe, expect, it, jest } from 'bun:test'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssignment } from './useAssignment'

const ID = 'ABCDEFGHIJKLMNOP'

const listing = {
  id: ID,
  senderType: 'BROKER',
  customerName: 'Acme AB',
  title: 'Frontendutvecklare',
  description: 'React.',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: null,
  contact: 'Kim',
  clientHourlyRate: '950',
  deleted: false,
}

type Scripted = { status: number; body: unknown }

// Answers by method + url so the order of calls does not matter.
const scriptFetch = (script: Record<string, Scripted>) => {
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    const hit = script[key]
    if (!hit) {
      throw new Error(`unscripted ${key}`)
    }
    return new Response(JSON.stringify(hit.body), { status: hit.status })
  })
  global.fetch = fn as unknown as typeof fetch
  return fn
}

describe('useAssignment', () => {
  afterEach(() => jest.restoreAllMocks())

  it('loads the listing and its comments sorted by id', async () => {
    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: { status: 200, body: listing },
      [`GET /api/uppdrag/assignments/${ID}/comments`]: {
        status: 200,
        body: [
          { id: 2, comment: 'Två', created: 2 },
          { id: 1, comment: 'Ett', created: 1 },
        ],
      },
    })
    const { result } = renderHook(() => useAssignment(ID))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.assignment).toMatchObject({
      id: ID,
      title: 'Frontendutvecklare',
    })
    expect(result.current.comments.map((c) => c.id)).toEqual([1, 2])
  })

  it('reports a missing listing and an error', async () => {
    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: {
        status: 404,
        body: { success: false },
      },
    })
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('missing'))

    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: {
        status: 502,
        body: { success: false },
      },
    })
    const { result: failed } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(failed.current.status).toBe('error'))
  })

  it('does not fetch comments for a deleted listing', async () => {
    const fetchMock = scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: {
        status: 200,
        body: { id: ID, title: 'Frontendutvecklare', deleted: true },
      },
    })
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.assignment?.deleted).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('adds a comment and reloads the list', async () => {
    let comments: unknown[] = []
    const fn = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        comments = [{ id: 1, comment: 'Ny', created: 3 }]
        return new Response(JSON.stringify({ success: true }), { status: 201 })
      }
      if (url.endsWith('/comments')) {
        return new Response(JSON.stringify(comments), { status: 200 })
      }
      return new Response(JSON.stringify(listing), { status: 200 })
    })
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => {
      await result.current.addComment('Ny')
    })
    expect(result.current.comments).toEqual([
      { id: 1, comment: 'Ny', created: 3 },
    ])
    const post = fn.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(post?.[0]).toBe(`/api/uppdrag/assignments/${ID}/comments`)
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ comment: 'Ny' })
  })

  it('deletes and reloads into the deleted state', async () => {
    let deleted = false
    const fn = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        deleted = true
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      if (url.endsWith('/comments')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      return new Response(
        JSON.stringify(
          deleted ? { id: ID, title: 't', deleted: true } : listing,
        ),
        { status: 200 },
      )
    })
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => {
      await result.current.remove()
    })
    expect(result.current.assignment?.deleted).toBe(true)
  })

  it('surfaces a failed delete', async () => {
    const fn = jest.fn(async (url: string, init?: RequestInit) =>
      init?.method === 'DELETE'
        ? new Response(JSON.stringify({ success: false, error: 'nope' }), {
            status: 502,
          })
        : url.endsWith('/comments')
          ? new Response(JSON.stringify([]), { status: 200 })
          : new Response(JSON.stringify(listing), { status: 200 }),
    )
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await expect(result.current.remove()).rejects.toThrow('nope')
  })
})
