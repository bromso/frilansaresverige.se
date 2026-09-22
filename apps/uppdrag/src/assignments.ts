import type { Db } from './db'
import type { Mailer } from './email'
import type { SlackPropagation } from './slack'
import { contactText } from './templates'
import type { Logger, SenderType } from './types'
import {
  isBlockedSender,
  parseAssignmentBody,
  parseCommentBody,
} from './validate'

export const json = (status: number, body: unknown): Response =>
  Response.json(body, { status })

export const fail = (status: number, error: string): Response =>
  json(status, { success: false, error })

export interface HandlerDeps {
  db: Db
  slack: SlackPropagation
  mailer: Mailer
  channels: Record<SenderType, string>
  blockedSenderDomains: readonly string[]
  log: Logger
}

export interface AssignmentHandlers {
  create(req: Request): Promise<Response>
  get(id: string): Promise<Response>
  remove(id: string): Promise<Response>
  listComments(id: string): Promise<Response>
  createComment(id: string, req: Request): Promise<Response>
}

// A malformed body is a client error, not a crash.
const readJson = async (req: Request): Promise<unknown> => {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

export function createAssignmentHandlers({
  db,
  slack,
  mailer,
  channels,
  blockedSenderDomains,
  log,
}: HandlerDeps): AssignmentHandlers {
  // Slack and mail happen after the response; a failure is logged and
  // picked up by the startup sync, never shown to the client.
  const background = (label: string, task: Promise<unknown>) => {
    task.catch((error) => log(label, error))
  }

  return {
    async create(req) {
      const parsed = parseAssignmentBody(await readJson(req))
      if (!parsed.ok) {
        return fail(400, parsed.error)
      }
      if (isBlockedSender(parsed.value.emailAddress, blockedSenderDomains)) {
        // Inherited behaviour: these senders believe they published.
        return json(201, { success: true, id: null })
      }
      const id = await db.saveAssignment(
        parsed.value,
        channels[parsed.value.senderType],
      )
      background(
        `Failed to post assignment ${id} to Slack`,
        slack.propagateAssignment(id),
      )
      background(
        `Failed to email the receipt for assignment ${id}`,
        db.getAssignment(id).then((row) => row && mailer.sendConfirmation(row)),
      )
      return json(201, { success: true, id })
    },

    async get(id) {
      const a = await db.getAssignment(id)
      if (a === null) {
        return fail(404, 'Not found')
      }
      // Withheld server-side, so a withdrawn listing cannot be read back
      // by anyone still holding the link.
      if (a.deleted !== null) {
        return json(200, { id: a.id, title: a.title, deleted: true })
      }
      return json(200, {
        id: a.id,
        senderType: a.senderType,
        customerName: a.customerName,
        title: a.title,
        description: a.description,
        location: a.location,
        scope: a.scope,
        workForm: a.workForm,
        contact: contactText(a),
        clientHourlyRate: a.clientHourlyRate,
        deleted: false,
      })
    },

    async remove(id) {
      const a = await db.getAssignment(id)
      if (a === null) {
        return fail(404, 'Not found')
      }
      await db.deleteAssignment(id)
      background(
        `Failed to propagate the deletion of assignment ${id} to Slack`,
        slack.propagateAssignmentDeletion(id),
      )
      return json(200, { success: true })
    },

    async listComments(id) {
      const a = await db.getAssignment(id)
      if (a === null) {
        return fail(404, 'Not found')
      }
      if (a.deleted !== null) {
        return json(200, [])
      }
      const comments = await db.getAssignmentComments(id)
      return json(
        200,
        comments.map((c) => ({
          id: c.id,
          comment: c.comment,
          created: c.created,
        })),
      )
    },

    async createComment(id, req) {
      const a = await db.getAssignment(id)
      if (a === null || a.deleted !== null) {
        return fail(404, 'Not found')
      }
      const parsed = parseCommentBody(await readJson(req))
      if (!parsed.ok) {
        return fail(400, parsed.error)
      }
      await db.saveAssignmentComment(id, parsed.value)
      background(
        `Failed to post the comments of assignment ${id} to Slack`,
        slack.propagateAssignmentComments(id),
      )
      return json(201, { success: true })
    },
  }
}
