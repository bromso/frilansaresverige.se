import type { NextApiRequest, NextApiResponse } from 'next'
import { HONEYPOT_FIELD } from './form-fields'
import { checkRateLimit } from './rate-limit.server'

export { HONEYPOT_FIELD }

// Shared plumbing for the two form API routes (/api/submit-gig-tip and
// /api/request-slack-invitation). Each route describes its fields and how
// to lay them out as a Slack message; this module does the rest: method
// and content-type checks, the honeypot, per-IP rate limiting, input
// validation and mrkdwn escaping, and posting to the incoming webhook
// with the result actually checked.

export interface FieldRule {
  /** Shown in the 400 error so a broken client can tell which field. */
  label: string
  /** Empty or missing values fail validation when true. */
  required?: boolean
  /** Hard cap on trimmed length; longer values fail validation. */
  max: number
  /** Optional shape check, applied to non-empty values only. */
  pattern?: RegExp
  /** Fixed set of allowed values, applied to non-empty values only. */
  oneOf?: readonly string[]
}

export type FieldRules<K extends string> = Record<K, FieldRule>

export type ValidationResult<K extends string> =
  | { ok: true; fields: Record<K, string> }
  | { ok: false; error: string }

// Slack incoming-webhook `text` is mrkdwn: `<!channel>` pings everyone,
// `<url|label>` forges link labels. Escaping the three control characters
// is Slack's documented way to render user text verbatim. Control
// characters are dropped so a submitter cannot smuggle in line breaks or
// terminal escapes; real newlines are kept for multi-line fields.
export const escapeMrkdwn = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')

/** Single-line fields also collapse newlines, so one field stays one line. */
export const escapeInline = (value: string): string =>
  escapeMrkdwn(value).replace(/\s*[\r\n]+\s*/g, ' ')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Pulls the declared fields out of an untrusted request body. Every
 * value comes back as a trimmed string (empty when absent), and the
 * first rule violation short-circuits with a message naming the field.
 */
export function readFields<K extends string>(
  body: unknown,
  rules: FieldRules<K>,
): ValidationResult<K> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }

  const fields = {} as Record<K, string>
  for (const key of Object.keys(rules) as K[]) {
    const rule = rules[key]
    const raw = body[key]
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      return { ok: false, error: `${rule.label} must be a string` }
    }
    const value = (raw ?? '').trim()

    if (value === '') {
      if (rule.required) {
        return { ok: false, error: `${rule.label} is required` }
      }
      fields[key] = ''
      continue
    }
    if (value.length > rule.max) {
      return {
        ok: false,
        error: `${rule.label} must be at most ${rule.max} characters`,
      }
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return { ok: false, error: `${rule.label} has an invalid format` }
    }
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      return { ok: false, error: `${rule.label} has an unknown value` }
    }
    fields[key] = value
  }
  return { ok: true, fields }
}

export interface SlackMessage {
  username: string
  icon_emoji: string
  text: string
}

export class SlackPostError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'SlackPostError'
  }
}

/**
 * Posts to an incoming webhook and resolves only when Slack accepted the
 * message. Slack answers a bare `ok` on success and a short error string
 * (`invalid_payload`, `no_service`, …) with a 4xx/5xx otherwise.
 */
export async function postSlackMessage(
  webhookURL: string,
  message: SlackMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(webhookURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
  const text = await response.text()
  if (!response.ok || text.trim() !== 'ok') {
    throw new SlackPostError(
      `Slack rejected the message: ${response.status} ${text.slice(0, 200)}`,
      response.status,
    )
  }
}

/** Best-effort client address for rate limiting behind a reverse proxy. */
export const clientKey = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const ip = first?.split(',')[0]?.trim() || req.socket?.remoteAddress
  return ip || 'unknown'
}

export interface SlackFormRoute<K extends string> {
  /** Name of the env var holding the incoming-webhook URL. */
  webhookEnv: string
  username: string
  icon_emoji: string
  rules: FieldRules<K>
  /** Builds the message text from already-validated, unescaped fields. */
  formatText: (fields: Record<K, string>) => string
}

export interface SuccessResponse {
  success: true
}
export interface ErrorResponse {
  success: false
  error: string
}
export type FormResponse = SuccessResponse | ErrorResponse

export interface HandlerDeps {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  now?: () => number
  log?: (message: string, detail?: unknown) => void
}

/**
 * Builds a Pages Router API handler for a Slack-backed form. The
 * dependencies are injectable so the handler can be exercised in
 * `bun test` without touching the network or the real environment.
 */
export function createSlackFormHandler<K extends string>(
  route: SlackFormRoute<K>,
  {
    env = process.env,
    fetchImpl = fetch,
    now = Date.now,
    log = (message, detail) => console.error(message, detail ?? ''),
  }: HandlerDeps = {},
) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<FormResponse>,
  ) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    // A cross-site HTML form can POST urlencoded data without CORS; the
    // site's own forms always send JSON, so anything else is dropped.
    const contentType = String(req.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().startsWith('application/json')) {
      res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json',
      })
      return
    }

    const webhookURL = env[route.webhookEnv]
    if (!webhookURL) {
      // Server misconfiguration, not a client error. Loud on purpose:
      // better than silently dropping someone's application.
      log(`${route.webhookEnv} is not set; refusing to accept the form`)
      res.status(500).json({
        success: false,
        error: 'The form is not configured on the server',
      })
      return
    }

    if (!checkRateLimit(clientKey(req), undefined, now())) {
      res.setHeader('Retry-After', '600')
      res.status(429).json({
        success: false,
        error: 'Too many submissions, please try again later',
      })
      return
    }

    const body: unknown = req.body
    if (isRecord(body) && String(body[HONEYPOT_FIELD] ?? '').trim() !== '') {
      res.status(200).json({ success: true })
      return
    }

    const parsed = readFields(body, route.rules)
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error })
      return
    }

    try {
      await postSlackMessage(
        webhookURL,
        {
          username: route.username,
          icon_emoji: route.icon_emoji,
          text: route.formatText(parsed.fields),
        },
        fetchImpl,
      )
    } catch (error) {
      log('Failed to post the form to Slack', error)
      res.status(502).json({
        success: false,
        error: 'The submission could not be delivered, please try again',
      })
      return
    }

    res.status(200).json({ success: true })
  }
}
