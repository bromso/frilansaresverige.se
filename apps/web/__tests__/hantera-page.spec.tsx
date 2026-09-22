import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

mock.module('next/router', () => ({
  useRouter: () => ({ isReady: true, query: { id: 'ABCDEFGHIJKLMNOP' } }),
}))

const { default: Hantera } = await import('../pages/tipsa/hantera/[id]')

const listing = {
  id: 'ABCDEFGHIJKLMNOP',
  senderType: 'DIRECT',
  customerName: 'Acme AB',
  title: 'Frontendutvecklare',
  description: 'React.',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: null,
  contact: 'Kim',
  clientHourlyRate: null,
  deleted: false,
}

const answer = (byUrl: (url: string) => { status: number; body: unknown }) => {
  global.fetch = jest.fn(async (url: string) => {
    const { status, body } = byUrl(url)
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof fetch
}

describe('/tipsa/hantera/[id]', () => {
  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  it('shows the listing, the comment form and the delete link', async () => {
    answer((url) =>
      url.endsWith('/comments')
        ? { status: 200, body: [] }
        : { status: 200, body: listing },
    )
    render(<Hantera />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Frontendutvecklare',
      ),
    )
    expect(screen.getByLabelText(/Komplettera uppdraget/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ta bort uppdraget' }),
    ).toBeInTheDocument()
  })

  it('tells the visitor when the listing is gone', async () => {
    answer(() => ({ status: 404, body: { success: false } }))
    render(<Hantera />)
    await waitFor(() =>
      expect(
        screen.getByText('Det uppdrag du söker kunde inte hittas.'),
      ).toBeInTheDocument(),
    )
  })

  it('hides the forms for a deleted listing', async () => {
    answer(() => ({
      status: 200,
      body: { id: listing.id, title: 'Frontendutvecklare', deleted: true },
    }))
    render(<Hantera />)
    await waitFor(() =>
      expect(
        screen.getByText('Denna uppdragsannons har raderats.'),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByLabelText(/Komplettera uppdraget/)).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Ta bort uppdraget' }),
    ).toBeNull()
  })

  it('closes the dialog and surfaces the error when deletion fails', async () => {
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/comments')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (init?.method === 'DELETE') {
        return new Response(JSON.stringify({ success: false, error: 'nope' }), {
          status: 502,
        })
      }
      return new Response(JSON.stringify(listing), { status: 200 })
    }) as unknown as typeof fetch

    render(<Hantera />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Frontendutvecklare',
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort uppdraget' }))
    const confirmButton = await screen.findByRole('button', {
      name: 'Ta bort',
    })
    fireEvent.click(confirmButton)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Något gick fel. Försök igen om en stund.',
      ),
    )
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})
