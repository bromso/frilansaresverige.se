import { SQL } from 'bun'
import type {
  Assignment,
  AssignmentComment,
  NewAssignment,
  SenderType,
} from './types'

export const randomString = (length = 16): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export const timestamp = (): number => Math.round(Date.now() / 1000)

export interface Db {
  saveAssignment(
    input: NewAssignment,
    slackChannel: string,
    now?: number,
  ): Promise<string>
  getAssignment(id: string): Promise<Assignment | null>
  getAssignmentIdsNeedingSlackPropagation(): Promise<string[]>
  getAssignmentIdsNeedingSlackDeletion(): Promise<string[]>
  getAssignmentComments(id: string): Promise<AssignmentComment[]>
  saveAssignmentComment(
    id: string,
    comment: string,
    now?: number,
  ): Promise<void>
  setAssignmentSlackId(id: string, slackId: string): Promise<void>
  setAssignmentSlackThreadId(id: string, slackThreadId: string): Promise<void>
  setAssignmentSlackChannelId(id: string, slackChannelId: string): Promise<void>
  /** Guarded so a repeated delete keeps the original timestamp. */
  deleteAssignment(id: string, now?: number): Promise<void>
  setAssignmentSlackDeleted(id: string): Promise<void>
  setAssignmentCommentSlackId(
    assignmentId: string,
    commentId: number,
    slackId: string,
  ): Promise<void>
  isHealthy(): Promise<boolean>
  close(): Promise<void>
}

type Row = Record<string, unknown>

const nullable = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value)

// MySQL bigints may arrive as number or bigint depending on the driver's
// range handling; normalise so the rest of the service only sees numbers.
const toAssignment = (row: Row): Assignment => ({
  id: String(row.id),
  senderType: row.senderType as SenderType,
  emailAddress: String(row.emailAddress),
  customerName: String(row.customerName),
  title: String(row.title),
  description: String(row.description),
  contact: nullable(row.contact),
  created: Number(row.created),
  slackChannel: String(row.slackChannel),
  slackId: nullable(row.slackId),
  slackThreadId: nullable(row.slackThreadId),
  slackChannelId: nullable(row.slackChannelId),
  customerOrganizationNumber: nullable(row.customerOrganizationNumber),
  customerFee: nullable(row.customerFee),
  clientHourlyRate: nullable(row.clientHourlyRate),
  location: nullable(row.location),
  deleted:
    row.deleted === null || row.deleted === undefined
      ? null
      : Number(row.deleted),
  slackDeleted: Number(row.slackDeleted) === 1,
  scope: nullable(row.scope),
  workForm: nullable(row.workForm),
  contactName: nullable(row.contactName),
  contactPhone: nullable(row.contactPhone),
  contactEmail: nullable(row.contactEmail),
})

const toComment = (row: Row): AssignmentComment => ({
  id: Number(row.id),
  comment: String(row.comment),
  created: Number(row.created),
  slackId: nullable(row.slackId),
})

export function createDb(mysqlUrl: string): Db {
  const sql = new SQL({ url: mysqlUrl, adapter: 'mysql' })

  return {
    async saveAssignment(input, slackChannel, now = timestamp()) {
      const id = randomString()
      await sql`
        INSERT INTO assignment (
          id, senderType, emailAddress, customerName, title, description,
          contact, created, slackChannel, slackId, customerOrganizationNumber,
          customerFee, clientHourlyRate, location, scope, workForm,
          contactName, contactPhone, contactEmail
        ) VALUES (
          ${id}, ${input.senderType}, ${input.emailAddress}, ${input.customerName},
          ${input.title}, ${input.description}, ${null}, ${now}, ${slackChannel},
          ${null}, ${input.customerOrganizationNumber}, ${input.customerFee},
          ${input.clientHourlyRate === null ? null : String(input.clientHourlyRate)},
          ${input.location}, ${input.scope}, ${input.workForm},
          ${input.contactName}, ${input.contactPhone}, ${input.contactEmail}
        )`
      return id
    },

    async getAssignment(id) {
      const rows = await sql<Row[]>`
        SELECT id, senderType, emailAddress, customerName, title, description,
          contact, created, slackChannel, slackId, slackThreadId, slackChannelId,
          customerOrganizationNumber, customerFee, clientHourlyRate, location,
          deleted, slackDeleted, scope, workForm, contactName, contactPhone,
          contactEmail
        FROM assignment WHERE id = ${id}`
      return rows.length === 1 ? toAssignment(rows[0]) : null
    },

    async getAssignmentIdsNeedingSlackPropagation() {
      const rows = await sql<
        Row[]
      >`SELECT id FROM assignment WHERE slackId IS NULL AND deleted IS NULL`
      return rows.map((row) => String(row.id))
    },

    async getAssignmentIdsNeedingSlackDeletion() {
      const rows = await sql<Row[]>`
        SELECT id FROM assignment WHERE deleted IS NOT NULL AND slackDeleted = 0`
      return rows.map((row) => String(row.id))
    },

    async getAssignmentComments(id) {
      const rows = await sql<Row[]>`
        SELECT id, comment, created, slackId
        FROM assignmentComment WHERE assignment = ${id} ORDER BY id`
      return rows.map(toComment)
    },

    async saveAssignmentComment(id, comment, now = timestamp()) {
      await sql`
        INSERT INTO assignmentComment (assignment, id, comment, created, slackId)
        VALUES (${id}, (
          SELECT COUNT(*) + 1 FROM assignmentComment AS t WHERE t.assignment = ${id}
        ), ${comment}, ${now}, ${null})`
    },

    async setAssignmentSlackId(id, slackId) {
      await sql`UPDATE assignment SET slackId = ${slackId} WHERE id = ${id}`
    },

    async setAssignmentSlackThreadId(id, slackThreadId) {
      await sql`UPDATE assignment SET slackThreadId = ${slackThreadId} WHERE id = ${id}`
    },

    async setAssignmentSlackChannelId(id, slackChannelId) {
      await sql`UPDATE assignment SET slackChannelId = ${slackChannelId} WHERE id = ${id}`
    },

    async deleteAssignment(id, now = timestamp()) {
      await sql`
        UPDATE assignment SET deleted = ${now}
        WHERE id = ${id} AND deleted IS NULL`
    },

    async setAssignmentSlackDeleted(id) {
      await sql`UPDATE assignment SET slackDeleted = 1 WHERE id = ${id}`
    },

    async setAssignmentCommentSlackId(assignmentId, commentId, slackId) {
      await sql`
        UPDATE assignmentComment SET slackId = ${slackId}
        WHERE assignment = ${assignmentId} AND id = ${commentId}`
    },

    async isHealthy() {
      try {
        await sql`SELECT id FROM assignment LIMIT 1`
        return true
      } catch {
        return false
      }
    },

    async close() {
      await sql.close()
    },
  }
}
