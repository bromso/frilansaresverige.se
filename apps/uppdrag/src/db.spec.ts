import { afterAll, describe, expect, it } from 'bun:test'
import { SQL } from 'bun'
import { createDb, randomString } from './db'
import type { NewAssignment } from './types'

// See apps/uppdrag/compose.yml for how to start the local MySQL this needs.
// The URL must include `?sslmode=require`, or Bun's mysql adapter fails
// authenticating against MySQL 8's default caching_sha2_password plugin.
const MYSQL_URL = process.env.MYSQL_URL

const input: NewAssignment = {
  senderType: 'BROKER',
  emailAddress: 'kim@broker.se',
  title: 'Frontendutvecklare',
  location: 'Göteborg',
  customerName: 'Acme AB',
  description: 'React.',
  scope: 'Heltid',
  workForm: 'Distans',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  customerOrganizationNumber: '556677-8899',
  customerFee: null,
  clientHourlyRate: 950,
}

describe('randomString', () => {
  it('makes 16 uppercase alphanumerics', () => {
    expect(randomString()).toMatch(/^[A-Z0-9]{16}$/)
    expect(randomString()).not.toBe(randomString())
  })
})

// Runs only against a real MySQL (see compose.yml); CI has none.
describe.skipIf(!MYSQL_URL)('createDb', () => {
  const db = createDb(MYSQL_URL ?? '')
  const cleanup = new SQL({ url: MYSQL_URL ?? '', adapter: 'mysql' })
  const created: string[] = []

  afterAll(async () => {
    for (const id of created) {
      await cleanup`DELETE FROM assignment WHERE id = ${id}`
    }
    await cleanup.close()
    await db.close()
  })

  it('round-trips an assignment', async () => {
    const id = await db.saveAssignment(input, '#broker', 1700000000)
    created.push(id)
    const row = await db.getAssignment(id)
    expect(row).toMatchObject({
      id,
      senderType: 'BROKER',
      title: 'Frontendutvecklare',
      contact: null,
      contactName: 'Kim',
      clientHourlyRate: '950',
      created: 1700000000,
      slackChannel: '#broker',
      slackId: null,
      deleted: null,
      slackDeleted: false,
    })
    expect(await db.getAssignment('NOPE')).toBeNull()
    expect(await db.getAssignmentIdsNeedingSlackPropagation()).toContain(id)
  })

  it('numbers comments per assignment and tracks their slack ids', async () => {
    const id = await db.saveAssignment(input, '#broker')
    created.push(id)
    await db.saveAssignmentComment(id, 'Ett', 1700000001)
    await db.saveAssignmentComment(id, 'Två', 1700000002)
    const comments = await db.getAssignmentComments(id)
    expect(comments.map((c) => [c.id, c.comment, c.slackId])).toEqual([
      [1, 'Ett', null],
      [2, 'Två', null],
    ])
    await db.setAssignmentCommentSlackId(id, 2, '1.2')
    expect((await db.getAssignmentComments(id))[1].slackId).toBe('1.2')
  })

  it('keeps the first deletion timestamp and flags slack deletion', async () => {
    const id = await db.saveAssignment(input, '#broker')
    created.push(id)
    await db.setAssignmentSlackId(id, '1.0')
    await db.deleteAssignment(id, 1700000010)
    await db.deleteAssignment(id, 1700000020)
    expect((await db.getAssignment(id))?.deleted).toBe(1700000010)
    expect(await db.getAssignmentIdsNeedingSlackDeletion()).toContain(id)
    await db.setAssignmentSlackDeleted(id)
    expect(await db.getAssignmentIdsNeedingSlackDeletion()).not.toContain(id)
    expect((await db.getAssignment(id))?.slackDeleted).toBe(true)
  })

  it('does not list a deleted, unposted row for propagation', async () => {
    const id = await db.saveAssignment(input, '#broker')
    created.push(id)
    await db.deleteAssignment(id, 1700000010)
    expect(await db.getAssignmentIdsNeedingSlackPropagation()).not.toContain(id)
    expect(await db.getAssignmentIdsNeedingSlackDeletion()).toContain(id)
  })

  it('reports health', async () => {
    expect(await db.isHealthy()).toBe(true)
  })
})
