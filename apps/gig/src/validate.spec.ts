import { describe, expect, it } from 'bun:test'
import {
  INVALID_EMAIL_ADDRESS,
  isBlockedSender,
  parseAssignmentBody,
  parseCommentBody,
} from './validate'

const valid = {
  senderType: 'BROKER',
  emailAddress: ' Kim@Broker.se ',
  title: 'Frontendutvecklare',
  location: 'Göteborg',
  customerName: 'Acme AB',
  description: 'React.',
  scope: 'Heltid',
  workForm: '',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  customerOrganizationNumber: '556677-8899',
  customerFee: '10 %',
  clientHourlyRate: '1 000',
}

describe('parseAssignmentBody', () => {
  it('normalises a valid body', () => {
    expect(parseAssignmentBody(valid)).toEqual({
      ok: true,
      value: {
        senderType: 'BROKER',
        emailAddress: 'kim@broker.se',
        title: 'Frontendutvecklare',
        location: 'Göteborg',
        customerName: 'Acme AB',
        description: 'React.',
        scope: 'Heltid',
        workForm: null,
        contactName: 'Kim',
        contactPhone: '070-123 45 67',
        contactEmail: 'kim@acme.se',
        customerOrganizationNumber: '556677-8899',
        customerFee: '10 %',
        clientHourlyRate: 1000,
      },
    })
  })

  it('accepts a numeric rate and treats blanks as null', () => {
    const result = parseAssignmentBody({
      ...valid,
      clientHourlyRate: 950,
      customerFee: '',
      customerOrganizationNumber: undefined,
    })
    expect(result).toMatchObject({
      ok: true,
      value: {
        clientHourlyRate: 950,
        customerFee: null,
        customerOrganizationNumber: null,
      },
    })
    expect(
      parseAssignmentBody({ ...valid, clientHourlyRate: '' }),
    ).toMatchObject({
      ok: true,
      value: { clientHourlyRate: null },
    })
  })

  it('rejects non-objects and unknown sender types', () => {
    expect(parseAssignmentBody('nope')).toEqual({
      ok: false,
      error: 'Request body must be a JSON object',
    })
    expect(parseAssignmentBody({ ...valid, senderType: 'OTHER' })).toEqual({
      ok: false,
      error: 'Avsändartyp has an unknown value',
    })
  })

  it('uses the legacy error code for a bad sender email', () => {
    expect(parseAssignmentBody({ ...valid, emailAddress: 'kim' })).toEqual({
      ok: false,
      error: INVALID_EMAIL_ADDRESS,
    })
  })

  it('names required and overlong fields', () => {
    expect(parseAssignmentBody({ ...valid, title: '' })).toEqual({
      ok: false,
      error: 'Titel is required',
    })
    expect(
      parseAssignmentBody({ ...valid, description: 'x'.repeat(5001) }),
    ).toEqual({
      ok: false,
      error: 'Beskrivning must be at most 5000 characters',
    })
    expect(parseAssignmentBody({ ...valid, title: 42 })).toEqual({
      ok: false,
      error: 'Titel must be a string',
    })
  })

  it('rejects a non-numeric or oversized rate', () => {
    expect(parseAssignmentBody({ ...valid, clientHourlyRate: 'abc' })).toEqual({
      ok: false,
      error: 'Minimumarvode must be a whole number',
    })
    expect(parseAssignmentBody({ ...valid, clientHourlyRate: 100000 })).toEqual(
      {
        ok: false,
        error: 'Minimumarvode must be at most 99999',
      },
    )
  })
})

describe('parseCommentBody', () => {
  it('returns the trimmed comment', () => {
    expect(parseCommentBody({ comment: ' Start i maj. ' })).toEqual({
      ok: true,
      value: 'Start i maj.',
    })
    expect(parseCommentBody({ comment: '' })).toEqual({
      ok: false,
      error: 'Komplettering is required',
    })
    expect(parseCommentBody(null)).toEqual({
      ok: false,
      error: 'Request body must be a JSON object',
    })
  })
})

describe('isBlockedSender', () => {
  it('matches on the domain only', () => {
    const blocked = ['gmail.com', 'partna.se']
    expect(isBlockedSender('a@gmail.com', blocked)).toBe(true)
    expect(isBlockedSender('a@acme.se', blocked)).toBe(false)
    expect(isBlockedSender('gmail.com@acme.se', blocked)).toBe(false)
  })
})
