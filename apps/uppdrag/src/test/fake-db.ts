import type { Db } from '../db'
import type { Assignment, AssignmentComment, NewAssignment } from '../types'

export interface FakeDb extends Db {
  assignments: Map<string, Assignment>
  comments: Map<string, AssignmentComment[]>
  /** Insert a fully specified row, for legacy or pre-posted states. */
  seed(assignment: Assignment, comments?: AssignmentComment[]): void
}

let counter = 0

export const fakeAssignment = (
  overrides: Partial<Assignment> = {},
): Assignment => ({
  id: `ID${String(++counter).padStart(14, '0')}`,
  senderType: 'BROKER',
  emailAddress: 'kim@broker.se',
  customerName: 'Acme AB',
  title: 'Frontendutvecklare',
  description: 'React.',
  contact: null,
  created: 1700000000,
  slackChannel: '#broker',
  slackId: null,
  slackThreadId: null,
  slackChannelId: null,
  customerOrganizationNumber: '556677-8899',
  customerFee: '10 %',
  clientHourlyRate: '950',
  location: 'Göteborg',
  deleted: null,
  slackDeleted: false,
  scope: 'Heltid',
  workForm: 'Distans',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  ...overrides,
})

export function createFakeDb(): FakeDb {
  const assignments = new Map<string, Assignment>()
  const comments = new Map<string, AssignmentComment[]>()
  const update = (id: string, patch: Partial<Assignment>) => {
    const row = assignments.get(id)
    if (row) {
      assignments.set(id, { ...row, ...patch })
    }
  }
  return {
    assignments,
    comments,
    seed(assignment, rows = []) {
      assignments.set(assignment.id, assignment)
      comments.set(assignment.id, rows)
    },
    async saveAssignment(input: NewAssignment, slackChannel, now = 1700000000) {
      const row = fakeAssignment({
        ...input,
        clientHourlyRate:
          input.clientHourlyRate === null
            ? null
            : String(input.clientHourlyRate),
        contact: null,
        created: now,
        slackChannel,
        slackId: null,
        slackThreadId: null,
        slackChannelId: null,
        deleted: null,
        slackDeleted: false,
      })
      assignments.set(row.id, row)
      comments.set(row.id, [])
      return row.id
    },
    async getAssignment(id) {
      return assignments.get(id) ?? null
    },
    async getAssignmentIdsNeedingSlackPropagation() {
      return [...assignments.values()]
        .filter((a) => a.slackId === null && a.deleted === null)
        .map((a) => a.id)
    },
    async getAssignmentIdsNeedingSlackDeletion() {
      return [...assignments.values()]
        .filter((a) => a.deleted !== null && !a.slackDeleted)
        .map((a) => a.id)
    },
    async getAssignmentComments(id) {
      return [...(comments.get(id) ?? [])]
    },
    async saveAssignmentComment(id, comment, now = 1700000001) {
      const rows = comments.get(id) ?? []
      rows.push({ id: rows.length + 1, comment, created: now, slackId: null })
      comments.set(id, rows)
    },
    async setAssignmentSlackId(id, slackId) {
      update(id, { slackId })
    },
    async setAssignmentSlackThreadId(id, slackThreadId) {
      update(id, { slackThreadId })
    },
    async setAssignmentSlackChannelId(id, slackChannelId) {
      update(id, { slackChannelId })
    },
    async deleteAssignment(id, now = 1700000010) {
      if (assignments.get(id)?.deleted === null) {
        update(id, { deleted: now })
      }
    },
    async setAssignmentSlackDeleted(id) {
      update(id, { slackDeleted: true })
    },
    async setAssignmentCommentSlackId(assignmentId, commentId, slackId) {
      const row = comments.get(assignmentId)?.find((c) => c.id === commentId)
      if (row) {
        row.slackId = slackId
      }
    },
    async isHealthy() {
      return true
    },
    async close() {},
  }
}
