import { describe, expect, it, jest } from 'bun:test'
import {
  createMemberCountCache,
  createSlackClient,
  createSlackPropagation,
  type SlackClient,
  type SlackResult,
} from './slack'
import { createFakeDb, fakeAssignment } from './test/fake-db'

const SITE = 'https://frilansaresverige.se'
const noLog = () => {}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('createSlackClient', () => {
  it('posts JSON with the bearer token and returns ts and channel', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ ok: true, ts: '1.1', channel: 'C1' }),
    )
    const client = createSlackClient(
      'xoxb',
      fetchImpl as unknown as typeof fetch,
    )
    const result = await client.postMessage({
      channel: '#broker',
      text: 'hej',
      thread_ts: '1.0',
      reply_broadcast: true,
    })
    expect(result).toEqual({ ok: true, ts: '1.1', channel: 'C1' })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://slack.com/api/chat.postMessage')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer xoxb',
    )
    expect(JSON.parse(String(init.body))).toEqual({
      channel: '#broker',
      text: 'hej',
      thread_ts: '1.0',
      reply_broadcast: true,
    })
  })

  it('surfaces Slack errors and transport failures as ok: false', async () => {
    const failing = createSlackClient('x', (async () =>
      jsonResponse({
        ok: false,
        error: 'channel_not_found',
      })) as unknown as typeof fetch)
    expect(await failing.updateMessage('C1', '1.1', 'x')).toEqual({
      ok: false,
      error: 'channel_not_found',
    })
    const broken = createSlackClient('x', (async () => {
      throw new Error('ECONNRESET')
    }) as unknown as typeof fetch)
    expect(await broken.postMessage({ channel: 'C', text: 't' })).toEqual({
      ok: false,
      error: 'ECONNRESET',
    })
  })

  it('reads the member count from conversations.info', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ ok: true, channel: { num_members: 4200 } }),
    )
    const client = createSlackClient(
      'xoxb',
      fetchImpl as unknown as typeof fetch,
    )
    expect(await client.channelMemberCount('C8P11NBEF')).toBe(4200)
    const [url] = fetchImpl.mock.calls[0] as unknown as [string]
    expect(url).toBe(
      'https://slack.com/api/conversations.info?channel=C8P11NBEF&include_num_members=true',
    )
    const failing = createSlackClient('x', (async () =>
      jsonResponse({
        ok: false,
        error: 'invalid_auth',
      })) as unknown as typeof fetch)
    expect(await failing.channelMemberCount('C')).toBeNull()
  })
})

// A scripted client: each call pops the next result, and every call is
// recorded so the specs can assert on what reached Slack.
const scriptedClient = (script: SlackResult[]) => {
  const calls: { method: string; args: unknown[] }[] = []
  const next = (method: string, args: unknown[]): SlackResult => {
    calls.push({ method, args })
    return (
      script.shift() ?? { ok: true, ts: `auto-${calls.length}`, channel: 'C1' }
    )
  }
  const client: SlackClient = {
    postMessage: async (message) => next('postMessage', [message]),
    updateMessage: async (channel, ts, text) =>
      next('updateMessage', [channel, ts, text]),
    channelMemberCount: async () => null,
  }
  return { client, calls }
}

describe('createSlackPropagation', () => {
  it('posts the message and the thread reply, storing ids and channel', async () => {
    const db = createFakeDb()
    const a = fakeAssignment()
    db.seed(a)
    const { client, calls } = scriptedClient([
      { ok: true, ts: '1.0', channel: 'C1' },
      { ok: true, ts: '1.1', channel: 'C1' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignment(a.id)
    expect(calls.map((c) => c.method)).toEqual(['postMessage', 'postMessage'])
    expect(calls[0].args[0]).toMatchObject({ channel: '#broker' })
    expect((calls[0].args[0] as { text: string }).text).toStartWith(
      '*Frontendutvecklare*',
    )
    expect(calls[1].args[0]).toMatchObject({
      channel: '#broker',
      thread_ts: '1.0',
    })
    expect(db.assignments.get(a.id)).toMatchObject({
      slackId: '1.0',
      slackChannelId: 'C1',
      slackThreadId: '1.1',
    })
  })

  it('only posts what is missing on a retry', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({ slackId: '1.0', slackChannelId: 'C1' })
    db.seed(a)
    const { client, calls } = scriptedClient([
      { ok: true, ts: '1.1', channel: 'C1' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignment(a.id)
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0]).toMatchObject({ thread_ts: '1.0' })
    expect(db.assignments.get(a.id)?.slackThreadId).toBe('1.1')
  })

  it('leaves ids null and logs when Slack refuses', async () => {
    const db = createFakeDb()
    const a = fakeAssignment()
    db.seed(a)
    const log = jest.fn()
    const { client, calls } = scriptedClient([
      { ok: false, error: 'channel_not_found' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log,
    })
    await slack.propagateAssignment(a.id)
    expect(calls).toHaveLength(1)
    expect(db.assignments.get(a.id)?.slackId).toBeNull()
    expect(log).toHaveBeenCalledTimes(1)
  })

  it('posts unposted comments as broadcast replies and escapes them', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({ slackId: '1.0' })
    db.seed(a, [
      { id: 1, comment: 'Gammal', created: 1, slackId: '1.5' },
      { id: 2, comment: '<!channel> ny', created: 2, slackId: null },
    ])
    const { client, calls } = scriptedClient([
      { ok: true, ts: '1.6', channel: 'C1' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignmentComments(a.id)
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0]).toEqual({
      channel: '#broker',
      thread_ts: '1.0',
      reply_broadcast: true,
      text: '*Komplettering*:\n&lt;!channel&gt; ny',
    })
    expect(db.comments.get(a.id)?.[1].slackId).toBe('1.6')
  })

  it('does not post comments for an unposted or deleted assignment', async () => {
    const db = createFakeDb()
    const unposted = fakeAssignment()
    const deleted = fakeAssignment({ slackId: '1.0', deleted: 5 })
    db.seed(unposted, [{ id: 1, comment: 'x', created: 1, slackId: null }])
    db.seed(deleted, [{ id: 1, comment: 'x', created: 1, slackId: null }])
    const { client, calls } = scriptedClient([])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignmentComments(unposted.id)
    await slack.propagateAssignmentComments(deleted.id)
    expect(calls).toHaveLength(0)
  })

  it('rewrites every message on deletion and flags it done', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({
      slackId: '1.0',
      slackThreadId: '1.1',
      slackChannelId: 'C1',
      deleted: 5,
    })
    db.seed(a, [{ id: 1, comment: 'x', created: 1, slackId: '1.5' }])
    const { client, calls } = scriptedClient([])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignmentDeletion(a.id)
    expect(calls.map((c) => c.args)).toEqual([
      ['C1', '1.0', 'Denna uppdragsannons har raderats.'],
      ['C1', '1.1', 'Denna uppdragsannons har raderats.'],
      ['C1', '1.5', 'Denna komplettering har raderats.'],
    ])
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(true)
  })

  it('treats terminal update errors as done but retryable ones as pending', async () => {
    const db = createFakeDb()
    const terminal = fakeAssignment({
      slackId: '1.0',
      slackChannelId: 'C1',
      deleted: 5,
    })
    const retry = fakeAssignment({
      slackId: '2.0',
      slackChannelId: 'C1',
      deleted: 5,
    })
    db.seed(terminal)
    db.seed(retry)
    const { client } = scriptedClient([
      { ok: false, error: 'message_not_found' },
      { ok: false, error: 'ratelimited' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignmentDeletion(terminal.id)
    await slack.propagateAssignmentDeletion(retry.id)
    expect(db.assignments.get(terminal.id)?.slackDeleted).toBe(true)
    expect(db.assignments.get(retry.id)?.slackDeleted).toBe(false)
  })

  it('keeps a deletion pending while a comment is still unposted', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({
      slackId: '1.0',
      slackChannelId: 'C1',
      deleted: 5,
    })
    db.seed(a, [{ id: 1, comment: 'x', created: 1, slackId: null }])
    const { client } = scriptedClient([])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignmentDeletion(a.id)
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(false)
  })

  it('propagates a deletion that happened while posting', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({ deleted: 5 })
    db.seed(a)
    const { client, calls } = scriptedClient([
      { ok: true, ts: '1.0', channel: 'C1' },
      { ok: true, ts: '1.1', channel: 'C1' },
    ])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignment(a.id)
    expect(calls.map((c) => c.method)).toEqual([
      'postMessage',
      'postMessage',
      'updateMessage',
      'updateMessage',
    ])
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(true)
  })

  it('sees a deletion that lands while the first post is in flight', async () => {
    const db = createFakeDb()
    const a = fakeAssignment()
    db.seed(a)
    const { client: scripted, calls } = scriptedClient([])
    const client: SlackClient = {
      ...scripted,
      postMessage: async (message) => {
        const result = await scripted.postMessage(message)
        if (calls.length === 1) {
          const row = db.assignments.get(a.id)
          if (row) {
            db.assignments.set(a.id, { ...row, deleted: 5 })
          }
        }
        return result
      },
    }
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.propagateAssignment(a.id)
    expect(calls.map((c) => c.method)).toEqual([
      'postMessage',
      'postMessage',
      'updateMessage',
      'updateMessage',
    ])
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(true)
  })

  it('sync never posts a listing that is already deleted', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({ slackId: null, deleted: 5 })
    db.seed(a)
    const { client, calls } = scriptedClient([])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.sync()
    expect(calls.map((c) => c.method)).not.toContain('postMessage')
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(true)
  })

  it('sync posts everything unposted and rewrites everything pending', async () => {
    const db = createFakeDb()
    const unposted = fakeAssignment()
    const pending = fakeAssignment({
      slackId: '1.0',
      slackChannelId: 'C1',
      deleted: 5,
    })
    db.seed(unposted)
    db.seed(pending)
    const { client, calls } = scriptedClient([])
    const slack = createSlackPropagation({
      db,
      slack: client,
      siteUrl: SITE,
      log: noLog,
    })
    await slack.sync()
    expect(calls.map((c) => c.method)).toEqual([
      'postMessage',
      'postMessage',
      'updateMessage',
    ])
  })
})

describe('createMemberCountCache', () => {
  it('is null until refreshed, then caches the count', async () => {
    let count: number | null = null
    const client = {
      channelMemberCount: async () => count,
    } as unknown as SlackClient
    const log = jest.fn()
    const cache = createMemberCountCache({ slack: client, channel: 'C', log })
    expect(cache.get()).toBeNull()
    await cache.refresh()
    expect(cache.get()).toBeNull()
    expect(log).toHaveBeenCalledTimes(1)
    count = 4200
    await cache.refresh()
    expect(cache.get()).toBe(4200)
  })
})
