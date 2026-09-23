import { afterAll, describe, expect, it, jest } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import type { FormEvent } from 'react'
import { SubmitError } from './submit-form'
import { useSubmitSlackInvitationForm } from './useSubmitSlackInvitationForm'

const mockFetch = (
  init: { status: number; body: unknown } | { reject: true },
) => {
  const fn = jest.fn().mockImplementation(() => {
    if ('reject' in init) {
      return Promise.reject(new Error('ooops'))
    }
    return Promise.resolve(
      new Response(JSON.stringify(init.body), { status: init.status }),
    )
  })
  global.fetch = fn as unknown as typeof fetch
  return fn
}

const createMockFormEvent = (data: Record<string, { value: string }> = {}) => ({
  preventDefault: () => {},
  target: {
    name: { value: 'name' },
    email: { value: 'mail' },
    roll: { value: 'roll' },
    ort: { value: 'ort' },
    portfolio: { value: 'portfolio' },
    howlong: { value: 'howlong' },
    companyName: { value: 'companyName' },
    linkedin: { value: 'linkedin' },
    motivation: { value: 'motivation' },
    ...data,
  },
})

const forceType = <T>(input: unknown) => input as T

describe('useSubmitSlackInvitationForm', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })
  it('should render with default values', () => {
    const { result } = renderHook(() => useSubmitSlackInvitationForm())
    expect(result.current).toEqual({
      submitForm: expect.any(Function),
      data: null,
      error: null,
      isLoading: false,
    })
  })

  it('should handle successful submission', async () => {
    const fetchMock = mockFetch({ status: 200, body: { success: true } })
    const mockedFormEvent = createMockFormEvent()
    const { result } = renderHook(() => useSubmitSlackInvitationForm())
    expect(result.current.data).toBe(null)

    await act(async () => {
      await result.current.submitForm(forceType<FormEvent>(mockedFormEvent))
    })
    expect(result.current.data?.success).toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/request-slack-invitation')
    expect(JSON.parse(init.body)).toMatchObject({
      name: 'name',
      companyName: 'companyName',
      website: '',
    })
  })

  it('should surface a rejected submission as an error', async () => {
    mockFetch({
      status: 502,
      body: { success: false, error: 'not delivered' },
    })
    const mockedFormEvent = createMockFormEvent()
    const { result } = renderHook(() => useSubmitSlackInvitationForm())

    await act(async () => {
      await result.current.submitForm(forceType<FormEvent>(mockedFormEvent))
    })
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBeInstanceOf(SubmitError)
    expect((result.current.error as SubmitError).status).toBe(502)
  })

  it('should handle a network error', async () => {
    mockFetch({ reject: true })
    const mockedFormEvent = createMockFormEvent()
    const { result } = renderHook(() => useSubmitSlackInvitationForm())
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    await act(async () => {
      await result.current.submitForm(forceType<FormEvent>(mockedFormEvent))
    })
    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual(new Error('ooops'))
    expect(result.current.isLoading).toBe(false)
  })
})
