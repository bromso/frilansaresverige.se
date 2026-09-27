import { describe, expect, it } from 'bun:test'
import { SubmitError } from '../hooks/submit-form'
import { describeGigError } from './gig-error-copy'

describe('describeGigError', () => {
  it('explains the service codes in Swedish', () => {
    expect(
      describeGigError(new SubmitError('BLOCKED_SENDER_DOMAIN', 400)),
    ).toMatch(/^Den e-postadressen går inte att använda som avsändare/)
    expect(
      describeGigError(new SubmitError('INVALID_EMAIL_ADDRESS', 400)),
    ).toMatch(/^E-postadressen är ogiltig/)
  })

  it('falls back to the generic copy for anything else', () => {
    expect(describeGigError(new SubmitError('Titel is required', 400))).toMatch(
      /^Något gick fel/,
    )
    expect(describeGigError(new Error('ECONNRESET'))).toMatch(/^Något gick fel/)
    expect(describeGigError(undefined)).toMatch(/^Något gick fel/)
  })
})
