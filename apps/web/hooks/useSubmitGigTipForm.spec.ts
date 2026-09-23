import { afterAll, describe, expect, it, jest } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import type { FormEvent } from 'react'
import { SubmitError } from './submit-form'
import { useSubmitGigTipForm } from './useSubmitGigTipForm'

const mockFetch = (
  init:
    | { status: number; body: unknown }
    | { reject: true }
    | { status: number; text: string },
) => {
  const fn = jest.fn().mockImplementation(() => {
    if ('reject' in init) {
      return Promise.reject(new Error('ooops'))
    }
    if ('text' in init) {
      return Promise.resolve(new Response(init.text, { status: init.status }))
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
    title: { value: 'title' },
    location: { value: 'location' },
    clientName: { value: 'clientName' },
    minRate: { value: '1000' },
    description: { value: 'description' },
    contactName: { value: 'contactName' },
    contactPhone: { value: '0701234567' },
    contactEmail: { value: 'contact@example.se' },
    relation: { value: 'direktavtal' },
    omfattning: { value: 'Heltid' },
    emailAddress: { value: 'sender@example.se' },
    customerOrganizationNumber: { value: '' },
    customerFee: { value: '' },
    ...data,
  },
})

const forceType = <T>(input: unknown) => input as T

describe('useSubmitGigTipForm', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })
  it('should render with default values', () => {
    const { result } = renderHook(() => useSubmitGigTipForm())
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
    const { result } = renderHook(() => useSubmitGigTipForm())
    expect(result.current.data).toBe(null)

    await act(async () => {
      await result.current.submitForm(forceType<FormEvent>(mockedFormEvent))
    })
    expect(result.current.data?.success).toBe(true)
    expect(result.current.isLoading).toBe(false)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/uppdrag/assignments')
    expect(JSON.parse(init.body)).toEqual({
      senderType: 'DIRECT',
      emailAddress: 'sender@example.se',
      title: 'title',
      location: 'location',
      customerName: 'clientName',
      description: 'description',
      scope: 'Heltid',
      workForm: '',
      clientHourlyRate: '1000',
      contactName: 'contactName',
      contactPhone: '0701234567',
      contactEmail: 'contact@example.se',
      customerOrganizationNumber: '',
      customerFee: '',
      website: '',
    })
  })

  it('maps a broker relation and passes the broker fields', async () => {
    const fetchMock = mockFetch({
      status: 201,
      body: { success: true, id: 'X' },
    })
    const { result } = renderHook(() => useSubmitGigTipForm())
    await act(async () => {
      await result.current.submitForm(
        forceType<FormEvent>(
          createMockFormEvent({
            relation: { value: 'formedlare' },
            customerOrganizationNumber: { value: '556677-8899' },
            customerFee: { value: '10 %' },
          }),
        ),
      )
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body)).toMatchObject({
      senderType: 'BROKER',
      customerOrganizationNumber: '556677-8899',
      customerFee: '10 %',
    })
  })

  it('should surface a rejected submission as an error', async () => {
    mockFetch({
      status: 400,
      body: { success: false, error: 'Titel is required' },
    })
    const mockedFormEvent = createMockFormEvent()
    const { result } = renderHook(() => useSubmitGigTipForm())

    await act(async () => {
      await result.current.submitForm(forceType<FormEvent>(mockedFormEvent))
    })
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBeInstanceOf(SubmitError)
    expect((result.current.error as SubmitError).status).toBe(400)
    expect((result.current.error as SubmitError).message).toBe(
      'Titel is required',
    )
  })

  it('should treat a non-JSON failure body as an error', async () => {
    mockFetch({ status: 502, text: 'Bad Gateway' })
    const { result } = renderHook(() => useSubmitGigTipForm())

    await act(async () => {
      await result.current.submitForm(
        forceType<FormEvent>(createMockFormEvent()),
      )
    })
    expect(result.current.data).toBe(null)
    expect((result.current.error as SubmitError).status).toBe(502)
  })

  it('should handle a network error', async () => {
    mockFetch({ reject: true })
    const mockedFormEvent = createMockFormEvent()
    const { result } = renderHook(() => useSubmitGigTipForm())
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
