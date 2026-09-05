import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import type { NextRouter } from 'next/router'
import type { ReactElement } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'
import GigTipForm from './GigTipForm'
import RequestSlackInvitationForm from './RequestSlackInvitationForm'

// The forms call useRouter for the post-submit redirect, which throws
// outside a mounted Pages Router; a bare context value is enough here.
const renderWithRouter = (ui: ReactElement) =>
  render(
    <RouterContext.Provider
      value={{ push: async () => true } as unknown as NextRouter}
    >
      {ui}
    </RouterContext.Provider>,
  )

// Render-level guards for the two Slack-backed forms: the honeypot is
// present but invisible to assistive tech, the first step is the only
// one exposed, and no error notice shows before anything was sent.
describe.each([
  ['GigTipForm', GigTipForm, 'Nästa'],
  ['RequestSlackInvitationForm', RequestSlackInvitationForm, 'Nästa'],
] as const)('%s', (_name, Form, nextLabel) => {
  afterEach(() => cleanup())

  it('renders the honeypot off-screen and hidden from assistive tech', () => {
    const { container } = renderWithRouter(<Form />)
    const honeypot = container.querySelector<HTMLInputElement>(
      `input[name="${HONEYPOT_FIELD}"]`,
    )
    expect(honeypot).not.toBeNull()
    expect(honeypot?.tabIndex).toBe(-1)
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Webbplats' })).toBeNull()
  })

  it('starts on step one with no error notice', () => {
    const { container } = renderWithRouter(<Form />)
    expect(screen.getByRole('button', { name: nextLabel })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(container.querySelector('form')).not.toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
