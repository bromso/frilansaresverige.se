import type { NewAssignment, SenderType } from './types'

export interface FieldRule {
  /** Shown in the 400 error so a broken client can tell which field. */
  label: string
  required?: boolean
  /** Hard cap on trimmed length. */
  max: number
  pattern?: RegExp
  oneOf?: readonly string[]
}

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/

/** The 400 body the old service sent; the site's form keys its copy on it. */
export const INVALID_EMAIL_ADDRESS = 'INVALID_EMAIL_ADDRESS'

// Same shape and messages as readFields in apps/web/lib/slack-form.server.ts,
// so the proxy can pass the error straight through to the form.
export function readFields<K extends string>(
  body: Record<string, unknown>,
  rules: Record<K, FieldRule>,
): Validation<Record<K, string>> {
  const value = {} as Record<K, string>
  for (const key of Object.keys(rules) as K[]) {
    const rule = rules[key]
    const raw = body[key]
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      return { ok: false, error: `${rule.label} must be a string` }
    }
    const text = ((raw as string | null | undefined) ?? '').trim()
    if (text === '') {
      if (rule.required) {
        return { ok: false, error: `${rule.label} is required` }
      }
      value[key] = ''
      continue
    }
    if (text.length > rule.max) {
      return {
        ok: false,
        error: `${rule.label} must be at most ${rule.max} characters`,
      }
    }
    if (rule.pattern && !rule.pattern.test(text)) {
      return { ok: false, error: `${rule.label} has an invalid format` }
    }
    if (rule.oneOf && !rule.oneOf.includes(text)) {
      return { ok: false, error: `${rule.label} has an unknown value` }
    }
    value[key] = text
  }
  return { ok: true, value }
}

/** Optional whole number; digits with spaces ("1 000") are accepted. */
export function readInteger(
  body: Record<string, unknown>,
  key: string,
  label: string,
  max: number,
): Validation<number | null> {
  const raw = body[key]
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: null }
  }
  const text =
    typeof raw === 'number'
      ? String(raw)
      : typeof raw === 'string'
        ? raw.replace(/\s/g, '')
        : null
  if (text === null || !/^[0-9]+$/.test(text)) {
    return { ok: false, error: `${label} must be a whole number` }
  }
  const value = Number.parseInt(text, 10)
  if (value > max) {
    return { ok: false, error: `${label} must be at most ${max}` }
  }
  return { ok: true, value }
}

const SENDER_TYPES: readonly SenderType[] = ['BROKER', 'DIRECT']

export const ASSIGNMENT_RULES = {
  senderType: {
    label: 'Avsändartyp',
    required: true,
    max: 10,
    oneOf: SENDER_TYPES,
  },
  emailAddress: { label: 'E-postadress', required: true, max: 254 },
  title: { label: 'Titel', required: true, max: 200 },
  location: { label: 'Plats', required: true, max: 200 },
  customerName: { label: 'Uppdragsgivare', required: true, max: 200 },
  description: { label: 'Beskrivning', required: true, max: 5000 },
  scope: { label: 'Omfattning', required: true, max: 40 },
  workForm: { label: 'Arbetsform', max: 100 },
  contactName: { label: 'Kontaktperson', required: true, max: 200 },
  contactPhone: { label: 'Telefon', required: true, max: 40 },
  contactEmail: {
    label: 'Kontakt-e-post',
    required: true,
    max: 254,
    pattern: EMAIL_PATTERN,
  },
  customerOrganizationNumber: { label: 'Organisationsnummer', max: 15 },
  customerFee: { label: 'Mellanhandsavgift', max: 50 },
} satisfies Record<string, FieldRule>

export function parseAssignmentBody(body: unknown): Validation<NewAssignment> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }
  const fields = readFields(body, ASSIGNMENT_RULES)
  if (!fields.ok) {
    return fields
  }
  const f = fields.value
  const emailAddress = f.emailAddress.toLowerCase()
  if (!EMAIL_PATTERN.test(emailAddress)) {
    return { ok: false, error: INVALID_EMAIL_ADDRESS }
  }
  const rate = readInteger(body, 'clientHourlyRate', 'Minimumarvode', 99999)
  if (!rate.ok) {
    return rate
  }
  return {
    ok: true,
    value: {
      senderType: f.senderType as SenderType,
      emailAddress,
      title: f.title,
      location: f.location,
      customerName: f.customerName,
      description: f.description,
      scope: f.scope,
      workForm: f.workForm || null,
      contactName: f.contactName,
      contactPhone: f.contactPhone,
      contactEmail: f.contactEmail.toLowerCase(),
      customerOrganizationNumber: f.customerOrganizationNumber || null,
      customerFee: f.customerFee || null,
      clientHourlyRate: rate.value,
    },
  }
}

export const COMMENT_RULES = {
  comment: { label: 'Komplettering', required: true, max: 5000 },
} satisfies Record<string, FieldRule>

export function parseCommentBody(body: unknown): Validation<string> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }
  const fields = readFields(body, COMMENT_RULES)
  return fields.ok ? { ok: true, value: fields.value.comment } : fields
}

export const senderDomain = (emailAddress: string): string =>
  emailAddress.slice(emailAddress.lastIndexOf('@') + 1).toLowerCase()

export const isBlockedSender = (
  emailAddress: string,
  blockedDomains: readonly string[],
): boolean => blockedDomains.includes(senderDomain(emailAddress))
