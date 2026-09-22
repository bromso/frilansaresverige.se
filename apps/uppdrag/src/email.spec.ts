import { describe, expect, it, jest } from 'bun:test'
import { CONFIRMATION_SUBJECT, createMailer } from './email'
import { fakeAssignment } from './test/fake-db'

const SITE = 'https://frilansaresverige.se'

describe('createMailer', () => {
  it('sends the confirmation to the sender with the manage link', async () => {
    const sendMail = jest.fn(async () => ({}))
    const mailer = createMailer(
      {
        email: { from: 'FS <hej@fs.se>', bcc: 'arkiv@fs.se', toOverride: null },
        siteUrl: SITE,
      },
      { sendMail },
      () => {},
    )
    const assignment = fakeAssignment({ id: 'ABCDEFGHIJKLMNOP' })
    await mailer.sendConfirmation(assignment)
    expect(sendMail).toHaveBeenCalledTimes(1)
    const options = (sendMail as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as Record<string, string>
    expect(options).toMatchObject({
      from: 'FS <hej@fs.se>',
      to: 'kim@broker.se',
      bcc: 'arkiv@fs.se',
      subject: CONFIRMATION_SUBJECT,
    })
    expect(options.text).toContain("rubriken 'Frontendutvecklare'")
    expect(options.text).toContain(`${SITE}/tipsa/hantera/ABCDEFGHIJKLMNOP`)
  })

  it('honours the dev override and omits an unset bcc', async () => {
    const sendMail = jest.fn(async () => ({}))
    const mailer = createMailer(
      {
        email: { from: 'f', bcc: null, toOverride: 'dev@fs.se' },
        siteUrl: SITE,
      },
      { sendMail },
      () => {},
    )
    await mailer.sendConfirmation(fakeAssignment())
    const options = (sendMail as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as Record<string, unknown>
    expect(options.to).toBe('dev@fs.se')
    expect('bcc' in options).toBe(false)
  })

  it('logs instead of throwing when the transport fails', async () => {
    const log = jest.fn()
    const mailer = createMailer(
      { email: { from: 'f', bcc: null, toOverride: null }, siteUrl: SITE },
      {
        sendMail: async () => {
          throw new Error('smtp down')
        },
      },
      log,
    )
    await expect(
      mailer.sendConfirmation(fakeAssignment()),
    ).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledTimes(1)
  })
})
