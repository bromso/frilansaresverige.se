import type { Db } from './db'
import {
  escapeMrkdwn,
  fillTemplate,
  TEMPLATES,
  type TemplateSource,
} from './templates'
import type { Logger } from './types'

export type SlackResult =
  | { ok: true; ts: string; channel: string }
  | { ok: false; error: string }

export interface SlackClient {
  postMessage(message: {
    channel: string
    text: string
    thread_ts?: string
    reply_broadcast?: boolean
  }): Promise<SlackResult>
  updateMessage(channel: string, ts: string, text: string): Promise<SlackResult>
  channelMemberCount(channel: string): Promise<number | null>
}

interface SlackPayload {
  ok: boolean
  error?: string
  ts?: string
  channel?: string | { num_members?: number }
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export function createSlackClient(
  token: string,
  fetchImpl: typeof fetch = fetch,
): SlackClient {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json; charset=utf-8',
  }

  const post = async (
    method: string,
    body: Record<string, unknown>,
  ): Promise<SlackResult> => {
    try {
      const response = await fetchImpl(`https://slack.com/api/${method}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const payload = (await response.json()) as SlackPayload
      if (!payload.ok) {
        return { ok: false, error: payload.error ?? `http_${response.status}` }
      }
      return {
        ok: true,
        ts: String(payload.ts ?? ''),
        channel: typeof payload.channel === 'string' ? payload.channel : '',
      }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  }

  return {
    postMessage: (message) => post('chat.postMessage', message),
    updateMessage: (channel, ts, text) =>
      post('chat.update', { channel, ts, text }),

    async channelMemberCount(channel) {
      try {
        const params = new URLSearchParams({
          channel,
          include_num_members: 'true',
        })
        const response = await fetchImpl(
          `https://slack.com/api/conversations.info?${params}`,
          { headers: { Authorization: headers.Authorization } },
        )
        const payload = (await response.json()) as SlackPayload
        if (!payload.ok || typeof payload.channel !== 'object') {
          return null
        }
        const count = payload.channel?.num_members
        return typeof count === 'number' ? count : null
      } catch {
        return null
      }
    },
  }
}

export interface SlackPropagation {
  sync(): Promise<void>
  propagateAssignment(id: string): Promise<void>
  propagateAssignmentComments(id: string): Promise<void>
  propagateAssignmentDeletion(id: string): Promise<void>
}

// Errors that will never succeed on a retry, so treat them as done rather
// than letting sync() attempt the same edit on every startup forever.
const TERMINAL_UPDATE_ERRORS = new Set([
  'message_not_found',
  'cant_update_message',
  'channel_not_found',
])

export function createSlackPropagation({
  db,
  slack,
  siteUrl,
  log,
}: {
  db: Db
  slack: SlackClient
  siteUrl: string
  log: Logger
}): SlackPropagation {
  const render = (template: string, source: TemplateSource) =>
    fillTemplate(template, source, siteUrl, escapeMrkdwn)

  const updateMessage = async (channel: string, ts: string, text: string) => {
    const result = await slack.updateMessage(channel, ts, text)
    if (result.ok) {
      return true
    }
    if (TERMINAL_UPDATE_ERRORS.has(result.error)) {
      log(`Giving up on Slack message ${ts}: ${result.error}`)
      return true
    }
    log(`Failed to update Slack message ${ts}: ${result.error}`)
    return false
  }

  const propagateAssignmentDeletion = async (id: string) => {
    const assignment = await db.getAssignment(id)
    if (assignment === null || assignment.deleted === null) {
      return
    }
    // chat.update needs the channel id; slackChannel holds a name. Rows
    // from before slackChannelId existed fall back to the name.
    const channel = assignment.slackChannelId ?? assignment.slackChannel
    let done = true
    if (assignment.slackId !== null) {
      done =
        (await updateMessage(
          channel,
          assignment.slackId,
          TEMPLATES.slackAssignmentDeleted,
        )) && done
    }
    if (assignment.slackThreadId !== null) {
      done =
        (await updateMessage(
          channel,
          assignment.slackThreadId,
          TEMPLATES.slackAssignmentDeleted,
        )) && done
    }
    for (const comment of await db.getAssignmentComments(id)) {
      if (comment.slackId === null) {
        // Still being posted; retry later rather than leave its text up.
        done = false
        continue
      }
      done =
        (await updateMessage(
          channel,
          comment.slackId,
          TEMPLATES.slackAssignmentCommentDeleted,
        )) && done
    }
    if (done) {
      await db.setAssignmentSlackDeleted(id)
    }
  }

  const propagateAssignment = async (id: string) => {
    const assignment = await db.getAssignment(id)
    if (assignment === null) {
      return
    }
    // Skip whatever already made it to Slack, so a retry never duplicates.
    let threadTs = assignment.slackId
    if (threadTs === null) {
      const result = await slack.postMessage({
        channel: assignment.slackChannel,
        text: render(TEMPLATES.slackAssignmentInitial, assignment),
      })
      if (result.ok) {
        await db.setAssignmentSlackId(id, result.ts)
        await db.setAssignmentSlackChannelId(id, result.channel)
        threadTs = result.ts
      } else {
        log(`Failed to post assignment ${id} to Slack: ${result.error}`)
      }
    }
    if (threadTs !== null && assignment.slackThreadId === null) {
      const result = await slack.postMessage({
        channel: assignment.slackChannel,
        text: render(TEMPLATES.slackAssignmentThread, assignment),
        thread_ts: threadTs,
      })
      if (result.ok) {
        await db.setAssignmentSlackThreadId(id, result.ts)
      } else {
        log(
          `Failed to post the thread for assignment ${id} to Slack: ${result.error}`,
        )
      }
    }
    // It may have been deleted while the posts above were in flight.
    if (assignment.deleted !== null) {
      await propagateAssignmentDeletion(id)
    }
  }

  const propagateAssignmentComments = async (id: string) => {
    const assignment = await db.getAssignment(id)
    if (
      assignment === null ||
      assignment.slackId === null ||
      assignment.deleted !== null
    ) {
      return
    }
    for (const comment of await db.getAssignmentComments(id)) {
      if (comment.slackId !== null) {
        continue
      }
      const result = await slack.postMessage({
        channel: assignment.slackChannel,
        thread_ts: assignment.slackId,
        reply_broadcast: true,
        text: render(TEMPLATES.slackAssignmentComment, {
          comment: comment.comment,
        }),
      })
      if (result.ok) {
        await db.setAssignmentCommentSlackId(id, comment.id, result.ts)
      } else {
        log(
          `Failed to post comment ${comment.id} for assignment ${id}: ${result.error}`,
        )
      }
    }
  }

  const sync = async () => {
    for (const id of await db.getAssignmentIdsNeedingSlackPropagation()) {
      await propagateAssignment(id)
    }
    for (const id of await db.getAssignmentIdsNeedingSlackDeletion()) {
      await propagateAssignmentDeletion(id)
    }
  }

  return {
    sync,
    propagateAssignment,
    propagateAssignmentComments,
    propagateAssignmentDeletion,
  }
}

export function createMemberCountCache({
  slack,
  channel,
  log,
  intervalMs = 60 * 60 * 1000,
}: {
  slack: SlackClient
  channel: string
  log: Logger
  intervalMs?: number
}) {
  let cached: number | null = null

  const refresh = async () => {
    const count = await slack.channelMemberCount(channel)
    if (count === null) {
      log('Failed to refresh the member count')
      return
    }
    cached = count
  }

  return {
    get: () => cached,
    refresh,
    async start() {
      await refresh()
      setInterval(() => void refresh(), intervalMs)
    },
  }
}
