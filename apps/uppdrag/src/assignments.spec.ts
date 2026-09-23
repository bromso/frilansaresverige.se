import { describe, expect, it, jest } from 'bun:test'
import { createAssignmentHandlers, type HandlerDeps } from './assignments'
import type { SlackPropagation } from './slack'
import { createFakeDb, fakeAssignment } from './test/fake-db'

const body = {
  senderType: 'DIRECT',
  emailAddress: 'kim@acme.se',
  title: 'Frontendutvecklare',
  location: 'Göteborg',
  customerName: 'Acme AB',
  description: 'React.',
  scope: 'Heltid',
  workForm: 'Distans',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  clientHourlyRate: '950',
}

const post = (json: unknown, url = 'http://x/api/assignments') =>
  new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof json === 'string' ? json : JSON.stringify(json),
  })

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const build = () => {
  const db = createFakeDb()
  const slack: SlackPropagation = {
    sync: jest.fn(async () => {}),
    propagateAssignment: jest.fn(async () => {}),
    propagateAssignmentComments: jest.fn(async () => {}),
    propagateAssignmentDeletion: jest.fn(async () => {}),
  }
  const mailer = { sendConfirmation: jest.fn(async () => {}) }
  const log = jest.fn()
  const deps: HandlerDeps = {
    db,
    slack,
    mailer,
    channels: { BROKER: '#broker', DIRECT: '#direct' },
    blockedSenderDomains: ['gmail.com'],
    log,
  }
  return { db, slack, mailer, log, handlers: createAssignmentHandlers(deps) }
}

describe('create', () => {
  it('stores the assignment in the channel for its sender type and kicks off slack and mail', async () => {
    const { db, slack, mailer, handlers } = build()
    const response = await handlers.create(post(body))
    expect(response.status).toBe(201)
    const payload = (await response.json()) as { success: boolean; id: string }
    expect(payload.success).toBe(true)
    expect(payload.id).toMatch(/^[A-Z0-9]{16}$/)
    expect(db.assignments.get(payload.id)).toMatchObject({
      slackChannel: '#direct',
      clientHourlyRate: '950',
    })
    await flush()
    expect(slack.propagateAssignment).toHaveBeenCalledWith(payload.id)
    expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1)
  })

  it('answers 400 with the validation message', async () => {
    const { handlers } = build()
    const response = await handlers.create(post({ ...body, title: '' }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Titel is required',
    })
    const bad = await handlers.create(post({ ...body, emailAddress: 'nope' }))
    expect(await bad.json()).toEqual({
      success: false,
      error: 'INVALID_EMAIL_ADDRESS',
    })
    const broken = await handlers.create(post('{not json'))
    expect(broken.status).toBe(400)
  })

  it('pretends to accept blocked sender domains', async () => {
    const { db, slack, log, handlers } = build()
    const response = await handlers.create(
      post({ ...body, emailAddress: 'a@gmail.com' }),
    )
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true, id: null })
    expect(db.assignments.size).toBe(0)
    expect(slack.propagateAssignment).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toContain('gmail.com')
    expect(log.mock.calls[0][0]).not.toContain('a@gmail.com')
  })
})

describe('get', () => {
  it('returns the public fields with a rendered contact', async () => {
    const { db, handlers } = build()
    const a = fakeAssignment()
    db.seed(a)
    const response = await handlers.get(a.id)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: a.id,
      senderType: 'BROKER',
      customerName: 'Acme AB',
      title: 'Frontendutvecklare',
      description: 'React.',
      location: 'Göteborg',
      scope: 'Heltid',
      workForm: 'Distans',
      contact: 'Kim\n070-123 45 67\nkim@acme.se',
      clientHourlyRate: '950',
      customerFee: '10 %',
      customerOrganizationNumber: '556677-8899',
      deleted: false,
    })
  })

  it('uses the legacy contact for old rows', async () => {
    const { db, handlers } = build()
    const a = fakeAssignment({
      contact: 'Ring Kim',
      contactName: null,
      scope: null,
    })
    db.seed(a)
    expect(await (await handlers.get(a.id)).json()).toMatchObject({
      contact: 'Ring Kim',
      scope: null,
    })
  })

  it('withholds a deleted assignment and 404s an unknown one', async () => {
    const { db, handlers } = build()
    const a = fakeAssignment({ deleted: 5 })
    db.seed(a)
    expect(await (await handlers.get(a.id)).json()).toEqual({
      id: a.id,
      title: 'Frontendutvecklare',
      deleted: true,
    })
    expect((await handlers.get('NOPE')).status).toBe(404)
  })
})

describe('remove', () => {
  it('soft-deletes and propagates', async () => {
    const { db, slack, handlers } = build()
    const a = fakeAssignment()
    db.seed(a)
    const response = await handlers.remove(a.id)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(db.assignments.get(a.id)?.deleted).not.toBeNull()
    await flush()
    expect(slack.propagateAssignmentDeletion).toHaveBeenCalledWith(a.id)
    expect((await handlers.remove('NOPE')).status).toBe(404)
  })
})

describe('comments', () => {
  it('lists public comment fields, empty when deleted', async () => {
    const { db, handlers } = build()
    const a = fakeAssignment()
    db.seed(a, [{ id: 1, comment: 'Ett', created: 7, slackId: '1.5' }])
    expect(await (await handlers.listComments(a.id)).json()).toEqual([
      { id: 1, comment: 'Ett', created: 7 },
    ])
    const gone = fakeAssignment({ deleted: 5 })
    db.seed(gone, [{ id: 1, comment: 'x', created: 7, slackId: null }])
    expect(await (await handlers.listComments(gone.id)).json()).toEqual([])
    expect((await handlers.listComments('NOPE')).status).toBe(404)
  })

  it('stores a comment and propagates it', async () => {
    const { db, slack, handlers } = build()
    const a = fakeAssignment()
    db.seed(a)
    const response = await handlers.createComment(
      a.id,
      post({ comment: ' Start i maj. ' }),
    )
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true })
    expect(db.comments.get(a.id)?.[0].comment).toBe('Start i maj.')
    await flush()
    expect(slack.propagateAssignmentComments).toHaveBeenCalledWith(a.id)
  })

  it('refuses comments on deleted or unknown assignments and empty ones', async () => {
    const { db, handlers } = build()
    const gone = fakeAssignment({ deleted: 5 })
    db.seed(gone)
    expect(
      (await handlers.createComment(gone.id, post({ comment: 'x' }))).status,
    ).toBe(404)
    expect(
      (await handlers.createComment('NOPE', post({ comment: 'x' }))).status,
    ).toBe(404)
    const a = fakeAssignment()
    db.seed(a)
    const response = await handlers.createComment(a.id, post({ comment: '' }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Komplettering is required',
    })
  })
})
