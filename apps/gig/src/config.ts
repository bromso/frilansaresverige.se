import type { SenderType } from './types'

export type Env = Record<string, string | undefined>

export interface Config {
  host: string
  port: number
  mysqlUrl: string
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  email: {
    from: string
    bcc: string | null
    /** When set, every mail goes here instead of to the sender (dev). */
    toOverride: string | null
  }
  slack: {
    token: string
    channels: Record<SenderType, string>
    memberCountChannel: string
  }
  /** Base for the manage link in the receipt mail and the redirects. */
  siteUrl: string
  /** Shared secret; apps/web sends it as a bearer token. */
  apiKey: string
  /** Sender domains that get a 201 with nothing stored (inherited). */
  blockedSenderDomains: string[]
}

const required = (env: Env, name: string): string => {
  const value = env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`)
  }
  return value
}

const optional = (env: Env, name: string): string | null =>
  env[name]?.trim() || null

const integer = (env: Env, name: string, fallback: number): number => {
  const raw = env[name]?.trim()
  if (!raw) {
    return fallback
  }
  const value = Number.parseInt(raw, 10)
  if (!Number.isInteger(value) || value <= 0 || String(value) !== raw) {
    throw new Error(
      `Environment variable ${name} must be a positive integer, got "${raw}"`,
    )
  }
  return value
}

// Read once at startup so a missing secret fails the process immediately
// instead of surfacing as a 500 on the first request that needs it.
export function loadConfig(env: Env = process.env): Config {
  return {
    host: env.HOST?.trim() || '0.0.0.0',
    port: integer(env, 'PORT', 8989),
    mysqlUrl: required(env, 'MYSQL_URL'),
    smtp: {
      host: required(env, 'SMTP_HOST'),
      port: integer(env, 'SMTP_PORT', 465),
      secure: (env.SMTP_SECURE ?? 'true').trim().toLowerCase() !== 'false',
      user: required(env, 'SMTP_USER'),
      pass: required(env, 'SMTP_PASS'),
    },
    email: {
      from: required(env, 'EMAIL_FROM'),
      bcc: optional(env, 'EMAIL_BCC'),
      toOverride: optional(env, 'EMAIL_TO_OVERRIDE'),
    },
    slack: {
      token: required(env, 'SLACK_BOT_TOKEN'),
      channels: {
        BROKER: required(env, 'SLACK_CHANNEL_BROKER'),
        DIRECT: required(env, 'SLACK_CHANNEL_DIRECT'),
      },
      memberCountChannel: env.SLACK_MEMBER_COUNT_CHANNEL?.trim() || 'C8P11NBEF',
    },
    siteUrl: required(env, 'SITE_URL').replace(/\/+$/, ''),
    apiKey: required(env, 'GIG_API_KEY'),
    blockedSenderDomains: (env.BLOCKED_SENDER_DOMAINS ?? 'gmail.com,partna.se')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean),
  }
}
