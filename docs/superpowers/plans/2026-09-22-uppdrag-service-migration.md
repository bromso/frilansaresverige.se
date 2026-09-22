# Uppdrag Service Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `apps/bot` (Express + MySQL + Vue) into `apps/uppdrag`, a Bun-native TypeScript service, and move its publish, manage, comment and delete flows into `apps/web` behind `/tipsa`.

**Architecture:** One `Bun.serve` process with a `routes` table, `Bun.SQL` (mysql adapter) for the existing schema, `fetch` against the Slack Web API, nodemailer for the receipt mail. `apps/web` never exposes the service: Pages Router API routes under `/api/uppdrag/…` forward to it with a shared bearer key, reusing the site's honeypot and rate limiter. Every module takes its collaborators as arguments so `bun test` runs without a network or database.

**Tech Stack:** Bun 1.4.2 (`Bun.serve`, `Bun.SQL`, `bun test`), TypeScript 6, nodemailer 9, Next.js 16 Pages Router, React 19, Tailwind 4, shadcn/animate-ui primitives from `packages/ui`, Biome.

**Spec:** `docs/superpowers/specs/2026-09-22-uppdrag-service-migration-design.md`

## Global Constraints

- Run every command from the repo root unless a step says otherwise. Tests: `bun test apps/uppdrag` or `bun test apps/web/...`. Lint: `bun run check:fix`. Typecheck: `bun run typecheck`.
- Bun is pinned to `1.4.2` (`.bun-version`, `oven/bun:1.4.2-alpine`). Do not bump.
- Biome style: single quotes, no semicolons, 2-space indent. Run `bun run check:fix` before every commit.
- Swedish for all user-facing copy, English for code and comments. No em dashes or dash asides in Swedish copy; du-tilltal.
- Brand coral `#ff9c8e` is never retuned. Form cards use the existing `bg-brand-cream text-brand-blue` surface and `FIELD_CLASSES` / `LABEL_CLASSES` from `apps/web/components/form-classes.ts`.
- Stored `senderType` values stay `BROKER` / `DIRECT`; the form's `relation` values stay `formedlare` / `direktavtal`. Assignment ids are 16 uppercase alphanumerics.
- Every service JSON response is `{ success: true, ... }` or `{ success: false, error }`, matching `apps/web/lib/slack-form.server.ts`.
- Behaviours inherited unchanged from the old service: blocked sender domains get a 201 and nothing stored; the dev-only `EMAIL_TO_OVERRIDE`; the terminal-error list for Slack `chat.update`; startup resync.
- Commit messages: `type(scope): lowercase summary`, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## File map

Service (`apps/uppdrag/`):

| File | Responsibility |
|---|---|
| `src/types.ts` | `SenderType`, `Assignment`, `AssignmentComment`, `NewAssignment`, `Logger` |
| `src/config.ts` | `loadConfig(env)`: typed config, throws on missing vars |
| `src/templates.ts` | Swedish templates, `fillTemplate`, `contactText`, `escapeMrkdwn`, `manageURL` |
| `src/validate.ts` | `readFields`, `parseAssignmentBody`, `parseCommentBody`, `isBlockedSender` |
| `src/db.ts` | `createDb(mysqlUrl)`: the model functions on `Bun.SQL` |
| `src/slack.ts` | `createSlackClient`, `createSlackPropagation`, `createMemberCountCache` |
| `src/email.ts` | `createTransport`, `createMailer` |
| `src/assignments.ts` | the five handlers as `(…) => Promise<Response>` |
| `src/server.ts` | `createRoutes(deps)`: the `Bun.serve` routes table with auth and redirects |
| `src/index.ts` | wires real implementations, starts the server and background jobs |
| `src/test/fake-db.ts` | in-memory `Db` for specs |
| `schema.sql`, `compose.yml`, `.env.example`, `Dockerfile`, `README.md` | data, local MySQL, docs, image |

Web (`apps/web/`):

| File | Responsibility |
|---|---|
| `lib/uppdrag-proxy.server.ts` | `createUppdragProxy(route)`: forwarding handler with honeypot + rate limit |
| `pages/api/uppdrag/assignments.ts`, `…/assignments/[id].ts`, `…/assignments/[id]/comments.ts` | the proxied endpoints |
| `hooks/useSubmitGigTipForm.ts` | maps the form to the service's body |
| `hooks/useAssignment.ts` | load, comment, delete for the manage page |
| `components/AssignmentPreview.tsx` | listing rendering shared by preview step and manage page |
| `components/GigTipForm.tsx` | broker fields + preview step |
| `pages/tipsa/hantera/[id].tsx` | manage page |

---

### Task 1: Workspace scaffold and config

**Files:**
- Move: `apps/bot` → `apps/uppdrag` (keep only `backend/structure.sql` as `apps/uppdrag/schema.sql`)
- Create: `packages/tsconfig/bun-service.json`, `apps/uppdrag/package.json`, `apps/uppdrag/tsconfig.json`, `apps/uppdrag/src/types.ts`, `apps/uppdrag/src/config.ts`, `apps/uppdrag/src/config.spec.ts`
- Modify: `packages/tsconfig/package.json`, `package.json` (root), `Dockerfile` (root), `.devcontainer/devcontainer.json`

**Interfaces:**
- Produces: `loadConfig(env?: Env): Config` (throws `Error('Missing required environment variable NAME')`), the types in `types.ts` used by every later task.

- [ ] **Step 1: Move the workspace and delete the old tooling**

```bash
mv apps/bot apps/uppdrag
mv apps/uppdrag/backend/structure.sql apps/uppdrag/schema.sql
rm -rf apps/uppdrag/frontend apps/uppdrag/backend apps/uppdrag/README.md apps/uppdrag/.gitignore
mkdir -p apps/uppdrag/src/test
ls apps/uppdrag   # expect: schema.sql src
```

- [ ] **Step 2: Add the tsconfig preset**

`packages/tsconfig/bun-service.json`:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["esnext"],
    "types": ["bun"]
  }
}
```

Add `"bun-service.json"` to the `files` array in `packages/tsconfig/package.json`.

- [ ] **Step 3: Create the workspace manifest and tsconfig**

`apps/uppdrag/package.json`:

```json
{
  "name": "@frilansaresverige/uppdrag",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "nodemailer": "^9.0.3"
  },
  "devDependencies": {
    "@frilansaresverige/tsconfig": "workspace:*",
    "@types/bun": "^1.4.0",
    "@types/nodemailer": "^7.0.0",
    "typescript": "^6.0.3"
  }
}
```

`apps/uppdrag/tsconfig.json`:

```json
{
  "extends": "@frilansaresverige/tsconfig/bun-service.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Root wiring**

In the root `package.json` `scripts`, add after `"dev"`:

```json
"dev:uppdrag": "bun run --filter '@frilansaresverige/uppdrag' dev",
```

In the root `Dockerfile`, after `COPY apps/story/package.json apps/story/` add:

```dockerfile
COPY apps/uppdrag/package.json apps/uppdrag/
```

and change the install line to:

```dockerfile
RUN bun install --frozen-lockfile --filter '!@frilansaresverige/story' --filter '!@frilansaresverige/uppdrag'
```

In `.devcontainer/devcontainer.json`, add to `mounts`:

```json
"source=frilansare-node-modules-uppdrag,target=${containerWorkspaceFolder}/apps/uppdrag/node_modules,type=volume"
```

append ` ${containerWorkspaceFolder}/apps/uppdrag/node_modules` to the `chown` list in `onCreateCommand`, add `8989` to `forwardPorts`, and add `"8989": { "label": "Uppdrag API", "onAutoForward": "silent" }` to `portsAttributes`.

- [ ] **Step 5: Install**

```bash
bun install
git status --short   # bun.lock modified, apps/uppdrag untracked
```

- [ ] **Step 6: Types**

`apps/uppdrag/src/types.ts`:

```ts
export type SenderType = 'BROKER' | 'DIRECT'

export type Logger = (message: string, detail?: unknown) => void

/** A row of `assignment`, with MySQL's bigints and tinyint normalised. */
export interface Assignment {
  id: string
  senderType: SenderType
  emailAddress: string
  customerName: string
  title: string
  description: string
  /** Free-text contact from rows created before the structured fields. */
  contact: string | null
  created: number
  slackChannel: string
  slackId: string | null
  slackThreadId: string | null
  slackChannelId: string | null
  customerOrganizationNumber: string | null
  customerFee: string | null
  clientHourlyRate: string | null
  location: string | null
  deleted: number | null
  slackDeleted: boolean
  scope: string | null
  workForm: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
}

export interface AssignmentComment {
  id: number
  comment: string
  created: number
  slackId: string | null
}

/** What the create endpoint accepts after validation. */
export interface NewAssignment {
  senderType: SenderType
  emailAddress: string
  title: string
  location: string
  customerName: string
  description: string
  scope: string
  workForm: string | null
  contactName: string
  contactPhone: string
  contactEmail: string
  customerOrganizationNumber: string | null
  customerFee: string | null
  clientHourlyRate: number | null
}
```

- [ ] **Step 7: Write the failing config test**

`apps/uppdrag/src/config.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test'
import { loadConfig } from './config'

const full = {
  MYSQL_URL: 'mysql://u:p@localhost:3306/uppdrag',
  SMTP_HOST: 'smtp.example.se',
  SMTP_USER: 'mailer',
  SMTP_PASS: 'secret',
  EMAIL_FROM: 'Frilansare Sverige <hej@example.se>',
  SLACK_BOT_TOKEN: 'xoxb-1',
  SLACK_CHANNEL_BROKER: '#uppdrag-formedlare',
  SLACK_CHANNEL_DIRECT: '#uppdrag-direkt',
  SITE_URL: 'https://frilansaresverige.se/',
  UPPDRAG_API_KEY: 'k',
}

describe('loadConfig', () => {
  it('reads every variable and applies defaults', () => {
    expect(loadConfig(full)).toEqual({
      host: '0.0.0.0',
      port: 8989,
      mysqlUrl: 'mysql://u:p@localhost:3306/uppdrag',
      smtp: {
        host: 'smtp.example.se',
        port: 465,
        secure: true,
        user: 'mailer',
        pass: 'secret',
      },
      email: {
        from: 'Frilansare Sverige <hej@example.se>',
        bcc: null,
        toOverride: null,
      },
      slack: {
        token: 'xoxb-1',
        channels: { BROKER: '#uppdrag-formedlare', DIRECT: '#uppdrag-direkt' },
        memberCountChannel: 'C8P11NBEF',
      },
      siteUrl: 'https://frilansaresverige.se',
      apiKey: 'k',
      blockedSenderDomains: ['gmail.com', 'partna.se'],
    })
  })

  it('honours overrides', () => {
    const config = loadConfig({
      ...full,
      PORT: '9000',
      HOST: '127.0.0.1',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      EMAIL_BCC: 'arkiv@example.se',
      EMAIL_TO_OVERRIDE: 'dev@example.se',
      SLACK_MEMBER_COUNT_CHANNEL: 'C123',
      BLOCKED_SENDER_DOMAINS: ' Example.com, spam.se ,',
    })
    expect(config.port).toBe(9000)
    expect(config.host).toBe('127.0.0.1')
    expect(config.smtp).toMatchObject({ port: 587, secure: false })
    expect(config.email).toEqual({
      from: full.EMAIL_FROM,
      bcc: 'arkiv@example.se',
      toOverride: 'dev@example.se',
    })
    expect(config.slack.memberCountChannel).toBe('C123')
    expect(config.blockedSenderDomains).toEqual(['example.com', 'spam.se'])
  })

  it('names the missing variable', () => {
    const { SLACK_BOT_TOKEN: _omitted, ...rest } = full
    expect(() => loadConfig(rest)).toThrow(
      'Missing required environment variable SLACK_BOT_TOKEN',
    )
    expect(() => loadConfig({ ...full, SMTP_HOST: '  ' })).toThrow(
      'Missing required environment variable SMTP_HOST',
    )
  })

  it('rejects a non-numeric port', () => {
    expect(() => loadConfig({ ...full, PORT: 'eighty' })).toThrow(
      'Environment variable PORT must be a positive integer',
    )
  })
})
```

- [ ] **Step 8: Run it, expect failure**

Run: `bun test apps/uppdrag/src/config.spec.ts`
Expected: FAIL, cannot resolve `./config`.

- [ ] **Step 9: Implement config**

`apps/uppdrag/src/config.ts`:

```ts
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
      secure: (env.SMTP_SECURE ?? 'true').trim() !== 'false',
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
    apiKey: required(env, 'UPPDRAG_API_KEY'),
    blockedSenderDomains: (env.BLOCKED_SENDER_DOMAINS ?? 'gmail.com,partna.se')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean),
  }
}
```

- [ ] **Step 10: Run tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: 4 pass, Biome clean, tsc clean.

- [ ] **Step 11: Commit**

```bash
git add -A apps/uppdrag packages/tsconfig package.json bun.lock Dockerfile .devcontainer/devcontainer.json
git commit -m "feat(uppdrag): scaffold the bun service workspace with typed config

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Templates

**Files:**
- Create: `apps/uppdrag/src/templates.ts`, `apps/uppdrag/src/templates.spec.ts`

**Interfaces:**
- Consumes: `Assignment`, `SenderType` from `types.ts`.
- Produces: `TEMPLATES` (six strings), `fillTemplate(template, source, siteUrl, escape?)`, `contactText(source)`, `escapeMrkdwn(value)`, `manageURL(siteUrl, id)`, `createCompanyURL(orgNr)`, type `TemplateSource = Partial<Assignment> & { comment?: string }`.

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/templates.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test'
import {
  contactText,
  createCompanyURL,
  escapeMrkdwn,
  fillTemplate,
  manageURL,
  TEMPLATES,
  type TemplateSource,
} from './templates'

const SITE = 'https://frilansaresverige.se'

const broker: TemplateSource = {
  id: 'ABCDEFGHIJKLMNOP',
  senderType: 'BROKER',
  title: 'Frontendutvecklare',
  description: 'React och TypeScript.',
  customerName: 'Acme AB',
  emailAddress: 'kim@broker.se',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: 'Distans, Hybrid',
  customerFee: '10 %',
  clientHourlyRate: '950',
  customerOrganizationNumber: '556677-8899',
  contactName: 'Kim Lindqvist',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  contact: null,
}

const direct: TemplateSource = {
  ...broker,
  senderType: 'DIRECT',
  emailAddress: 'kim@acme.se',
  customerFee: null,
  clientHourlyRate: null,
  workForm: null,
  customerOrganizationNumber: null,
}

describe('contactText', () => {
  it('joins the structured fields', () => {
    expect(contactText(broker)).toBe('Kim Lindqvist\n070-123 45 67\nkim@acme.se')
  })

  it('falls back to the legacy free text', () => {
    expect(
      contactText({ contact: 'Ring Kim på 070', contactName: null }),
    ).toBe('Ring Kim på 070')
    expect(contactText({})).toBe('')
  })
})

describe('urls', () => {
  it('builds the manage and company urls', () => {
    expect(manageURL(SITE, 'ABC')).toBe(`${SITE}/tipsa/hantera/ABC`)
    expect(createCompanyURL('556677-8899')).toBe(
      'https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899',
    )
  })
})

describe('escapeMrkdwn', () => {
  it('neutralises the three control characters and drops others', () => {
    expect(escapeMrkdwn('<!channel> a & b\u0000\n')).toBe(
      '&lt;!channel&gt; a &amp; b\n',
    )
  })
})

describe('fillTemplate', () => {
  it('renders every line for a broker assignment', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentInitial, broker, SITE)).toBe(
      [
        '*Frontendutvecklare*',
        '',
        '*Plats:* Göteborg',
        '',
        '*Omfattning:* Heltid',
        '',
        '*Arbetsform:* Distans, Hybrid',
        '',
        '*Uppdragsgivare:* Acme AB',
        '',
        '*Avsändare:* kim@broker.se',
        '',
        '*Mellanhandsavgift:* 10 %',
        '',
        '*Minimum arvode:* 950 kr/h',
        '',
        '*Kontaktuppgifter:*',
        'Kim Lindqvist',
        '070-123 45 67',
        'kim@acme.se',
      ].join('\n'),
    )
  })

  it('drops the lines whose value is missing, without leaving gaps', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentInitial, direct, SITE)).toBe(
      [
        '*Frontendutvecklare*',
        '',
        '*Plats:* Göteborg',
        '',
        '*Omfattning:* Heltid',
        '',
        '*Uppdragsgivare:* Acme AB',
        '',
        '*Avsändare:* kim@acme.se',
        '',
        '*Kontaktuppgifter:*',
        'Kim Lindqvist',
        '070-123 45 67',
        'kim@acme.se',
      ].join('\n'),
    )
  })

  it('says "Vill ej uppge" for a broker without a fee', () => {
    const text = fillTemplate(
      TEMPLATES.slackAssignmentInitial,
      { ...broker, customerFee: null },
      SITE,
    )
    expect(text).toContain('*Mellanhandsavgift:* Vill ej uppge')
  })

  it('renders the thread with and without the company link', () => {
    expect(fillTemplate(TEMPLATES.slackAssignmentThread, broker, SITE)).toBe(
      '*Beskrivning:*\nReact och TypeScript.\n\n*Om uppdragsgivaren:* https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899',
    )
    expect(fillTemplate(TEMPLATES.slackAssignmentThread, direct, SITE)).toBe(
      '*Beskrivning:*\nReact och TypeScript.',
    )
  })

  it('renders a comment', () => {
    expect(
      fillTemplate(TEMPLATES.slackAssignmentComment, { comment: 'Start i maj.' }, SITE),
    ).toBe('*Komplettering*:\nStart i maj.')
  })

  it('puts the manage link in the confirmation mail', () => {
    const text = fillTemplate(TEMPLATES.confirmation, broker, SITE)
    expect(text).toStartWith('Hej!')
    expect(text).toContain("rubriken 'Frontendutvecklare'")
    expect(text).toContain(`\n${SITE}/tipsa/hantera/ABCDEFGHIJKLMNOP\n`)
  })

  it('escapes user text but not urls when an escape is given', () => {
    const text = fillTemplate(
      TEMPLATES.slackAssignmentThread,
      { ...broker, description: '<!channel> & co' },
      SITE,
      escapeMrkdwn,
    )
    expect(text).toContain('&lt;!channel&gt; &amp; co')
    expect(text).toContain('https://www.allabolag.se/bransch-s%C3%B6k?q=5566778899')
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/templates.spec.ts`
Expected: FAIL, cannot resolve `./templates`.

- [ ] **Step 3: Implement**

`apps/uppdrag/src/templates.ts`:

```ts
import type { Assignment } from './types'

// The message and mail bodies from the original service's config, plus
// Omfattning and Arbetsform lines for the fields the site's form collects.
// fillTemplate strips the indentation; a line whose placeholder has no
// value is dropped together with the blank line after it, so an optional
// field leaves no gap.
export const TEMPLATES = {
  confirmation: `
    Hej!

    Det konsultuppdrag med rubriken '[[TITLE]]' som du skickade till Frilansare Sverige har publicerats. Om du vill uppdatera det kan du använda dig av följande länk.
    [[URL]]

    Tänk på att hålla länken hemlig, eftersom vem som helst som har den kan uppdatera publikationen.

    Har du några frågor går det bra att svara på det här e-brevet.

    Hälsningar från Frilansare Sverige
  `,
  slackAssignmentInitial: `
    *[[TITLE]]*

    *Plats:* [[LOCATION]]

    *Omfattning:* [[SCOPE]]

    *Arbetsform:* [[WORK_FORM]]

    *Uppdragsgivare:* [[CUSTOMER_NAME]]

    *Avsändare:* [[SENDER_EMAIL]]

    *Mellanhandsavgift:* [[CUSTOMER_FEE]]

    *Minimum arvode:* [[HOURLY_RATE]] kr/h

    *Kontaktuppgifter:*
    [[CONTACT]]
  `,
  slackAssignmentThread: `
    *Beskrivning:*
    [[DESCRIPTION]]

    *Om uppdragsgivaren:* [[CUSTOMER_COMPANY_URL]]
  `,
  slackAssignmentComment: `
    *Komplettering*:
    [[COMMENT]]
  `,
  slackAssignmentDeleted: 'Denna uppdragsannons har raderats.',
  slackAssignmentCommentDeleted: 'Denna komplettering har raderats.',
} as const

export type TemplateSource = Partial<Assignment> & { comment?: string }

/** Structured contact lines for new rows, the free text for old ones. */
export const contactText = (
  source: Pick<
    TemplateSource,
    'contact' | 'contactName' | 'contactPhone' | 'contactEmail'
  >,
): string => {
  if (source.contactName) {
    return [source.contactName, source.contactPhone, source.contactEmail]
      .filter((value): value is string => Boolean(value))
      .join('\n')
  }
  return source.contact ?? ''
}

export const parseOrganizationNumber = (organizationNumber: string): string =>
  organizationNumber.replace(/[^A-Za-z0-9]/g, '')

export const createCompanyURL = (organizationNumber: string): string =>
  `https://www.allabolag.se/bransch-s%C3%B6k?q=${parseOrganizationNumber(organizationNumber)}`

export const manageURL = (siteUrl: string, id: string): string =>
  `${siteUrl}/tipsa/hantera/${id}`

// Slack mrkdwn: `<!channel>` pings everyone and `<url|label>` forges
// links, so user text is escaped the way Slack documents. Control
// characters are dropped; newlines are kept for multi-line fields.
export const escapeMrkdwn = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')

const present = (value: string | number | null | undefined): string | null =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value)

const URL_KEYS = new Set(['URL', 'CUSTOMER_COMPANY_URL'])

// Null means "drop this line".
const resolve = (
  key: string,
  source: TemplateSource,
  siteUrl: string,
): string | null => {
  switch (key) {
    case 'TITLE':
      return source.title ?? ''
    case 'DESCRIPTION':
      return source.description ?? ''
    case 'CUSTOMER_NAME':
      return source.customerName ?? ''
    case 'SENDER_EMAIL':
      return source.emailAddress ?? ''
    case 'COMMENT':
      return source.comment ?? ''
    case 'CONTACT':
      return contactText(source)
    case 'URL':
      return manageURL(siteUrl, source.id ?? '')
    case 'LOCATION':
      return present(source.location)
    case 'SCOPE':
      return present(source.scope)
    case 'WORK_FORM':
      return present(source.workForm)
    case 'HOURLY_RATE':
      return present(source.clientHourlyRate)
    case 'CUSTOMER_COMPANY_URL': {
      const number = present(source.customerOrganizationNumber)
      return number ? createCompanyURL(number) : null
    }
    case 'CUSTOMER_FEE': {
      const fee = present(source.customerFee)
      if (fee) {
        return fee
      }
      // Direct clients have no middleman fee; a broker that left it out
      // is called out as not disclosing it.
      return source.senderType === 'DIRECT' ? null : 'Vill ej uppge'
    }
    default:
      return `[[${key}]]`
  }
}

export function fillTemplate(
  template: string,
  source: TemplateSource,
  siteUrl: string,
  escape: (value: string) => string = (value) => value,
): string {
  const lines = template
    .trim()
    .replace(/\n[ \t]+/g, '\n')
    .split('\n')
  const out: string[] = []
  let skipBlank = false
  for (const line of lines) {
    if (skipBlank) {
      skipBlank = false
      if (line === '') {
        continue
      }
    }
    let dropped = false
    const filled = line.replace(/\[\[([A-Z_]+)\]\]/g, (_, key: string) => {
      const value = resolve(key, source, siteUrl)
      if (value === null) {
        dropped = true
        return ''
      }
      return URL_KEYS.has(key) ? value : escape(value)
    })
    if (dropped) {
      skipBlank = true
      continue
    }
    out.push(filled)
  }
  while (out.length > 0 && out[out.length - 1] === '') {
    out.pop()
  }
  return out.join('\n')
}
```

- [ ] **Step 4: Run tests, lint**

Run: `bun test apps/uppdrag/src/templates.spec.ts && bun run check:fix`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/uppdrag/src/templates.ts apps/uppdrag/src/templates.spec.ts
git commit -m "feat(uppdrag): message templates with optional-line dropping and mrkdwn escaping

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Request validation

**Files:**
- Create: `apps/uppdrag/src/validate.ts`, `apps/uppdrag/src/validate.spec.ts`

**Interfaces:**
- Consumes: `NewAssignment`, `SenderType`.
- Produces: `type Validation<T> = { ok: true; value: T } | { ok: false; error: string }`, `parseAssignmentBody(body: unknown): Validation<NewAssignment>`, `parseCommentBody(body: unknown): Validation<string>`, `isBlockedSender(email, domains): boolean`, `INVALID_EMAIL_ADDRESS`, `isRecord`.

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/validate.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test'
import {
  INVALID_EMAIL_ADDRESS,
  isBlockedSender,
  parseAssignmentBody,
  parseCommentBody,
} from './validate'

const valid = {
  senderType: 'BROKER',
  emailAddress: ' Kim@Broker.se ',
  title: 'Frontendutvecklare',
  location: 'Göteborg',
  customerName: 'Acme AB',
  description: 'React.',
  scope: 'Heltid',
  workForm: '',
  contactName: 'Kim',
  contactPhone: '070-123 45 67',
  contactEmail: 'kim@acme.se',
  customerOrganizationNumber: '556677-8899',
  customerFee: '10 %',
  clientHourlyRate: '1 000',
}

describe('parseAssignmentBody', () => {
  it('normalises a valid body', () => {
    expect(parseAssignmentBody(valid)).toEqual({
      ok: true,
      value: {
        senderType: 'BROKER',
        emailAddress: 'kim@broker.se',
        title: 'Frontendutvecklare',
        location: 'Göteborg',
        customerName: 'Acme AB',
        description: 'React.',
        scope: 'Heltid',
        workForm: null,
        contactName: 'Kim',
        contactPhone: '070-123 45 67',
        contactEmail: 'kim@acme.se',
        customerOrganizationNumber: '556677-8899',
        customerFee: '10 %',
        clientHourlyRate: 1000,
      },
    })
  })

  it('accepts a numeric rate and treats blanks as null', () => {
    const result = parseAssignmentBody({
      ...valid,
      clientHourlyRate: 950,
      customerFee: '',
      customerOrganizationNumber: undefined,
    })
    expect(result).toMatchObject({
      ok: true,
      value: { clientHourlyRate: 950, customerFee: null, customerOrganizationNumber: null },
    })
    expect(parseAssignmentBody({ ...valid, clientHourlyRate: '' })).toMatchObject({
      ok: true,
      value: { clientHourlyRate: null },
    })
  })

  it('rejects non-objects and unknown sender types', () => {
    expect(parseAssignmentBody('nope')).toEqual({
      ok: false,
      error: 'Request body must be a JSON object',
    })
    expect(parseAssignmentBody({ ...valid, senderType: 'OTHER' })).toEqual({
      ok: false,
      error: 'Avsändartyp has an unknown value',
    })
  })

  it('uses the legacy error code for a bad sender email', () => {
    expect(parseAssignmentBody({ ...valid, emailAddress: 'kim' })).toEqual({
      ok: false,
      error: INVALID_EMAIL_ADDRESS,
    })
  })

  it('names required and overlong fields', () => {
    expect(parseAssignmentBody({ ...valid, title: '' })).toEqual({
      ok: false,
      error: 'Titel is required',
    })
    expect(
      parseAssignmentBody({ ...valid, description: 'x'.repeat(5001) }),
    ).toEqual({ ok: false, error: 'Beskrivning must be at most 5000 characters' })
    expect(parseAssignmentBody({ ...valid, title: 42 })).toEqual({
      ok: false,
      error: 'Titel must be a string',
    })
  })

  it('rejects a non-numeric or oversized rate', () => {
    expect(parseAssignmentBody({ ...valid, clientHourlyRate: 'abc' })).toEqual({
      ok: false,
      error: 'Minimumarvode must be a whole number',
    })
    expect(parseAssignmentBody({ ...valid, clientHourlyRate: 100000 })).toEqual({
      ok: false,
      error: 'Minimumarvode must be at most 99999',
    })
  })
})

describe('parseCommentBody', () => {
  it('returns the trimmed comment', () => {
    expect(parseCommentBody({ comment: ' Start i maj. ' })).toEqual({
      ok: true,
      value: 'Start i maj.',
    })
    expect(parseCommentBody({ comment: '' })).toEqual({
      ok: false,
      error: 'Komplettering is required',
    })
    expect(parseCommentBody(null)).toEqual({
      ok: false,
      error: 'Request body must be a JSON object',
    })
  })
})

describe('isBlockedSender', () => {
  it('matches on the domain only', () => {
    const blocked = ['gmail.com', 'partna.se']
    expect(isBlockedSender('a@gmail.com', blocked)).toBe(true)
    expect(isBlockedSender('a@acme.se', blocked)).toBe(false)
    expect(isBlockedSender('gmail.com@acme.se', blocked)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/validate.spec.ts`
Expected: FAIL, cannot resolve `./validate`.

- [ ] **Step 3: Implement**

`apps/uppdrag/src/validate.ts`:

```ts
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
  senderType: { label: 'Avsändartyp', required: true, max: 10, oneOf: SENDER_TYPES },
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

export const isBlockedSender = (
  emailAddress: string,
  blockedDomains: readonly string[],
): boolean =>
  blockedDomains.includes(
    emailAddress.slice(emailAddress.lastIndexOf('@') + 1).toLowerCase(),
  )
```

- [ ] **Step 4: Run tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/uppdrag/src/validate.ts apps/uppdrag/src/validate.spec.ts
git commit -m "feat(uppdrag): validate assignment and comment bodies

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Database, schema, local MySQL and the in-memory fake

**Files:**
- Create: `apps/uppdrag/src/db.ts`, `apps/uppdrag/src/db.spec.ts`, `apps/uppdrag/src/test/fake-db.ts`, `apps/uppdrag/compose.yml`
- Modify: `apps/uppdrag/schema.sql` (append the migration block)

**Interfaces:**
- Consumes: `Assignment`, `AssignmentComment`, `NewAssignment` from `types.ts`.
- Produces: `interface Db` (below), `createDb(mysqlUrl): Db`, `randomString(length?)`, `timestamp()`, and `createFakeDb(): FakeDb` (a `Db` with `assignments: Map<string, Assignment>` and `comments: Map<string, AssignmentComment[]>` exposed) for later specs.

- [ ] **Step 1: Extend the schema**

Append to `apps/uppdrag/schema.sql`:

```sql

-- 2026-09: the site's form collects structured contact details, scope and
-- work form. Rows created by the old service keep their free-text contact;
-- the service renders whichever is present.
ALTER TABLE `assignment`
  MODIFY `contact` text COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `scope` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `workForm` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactPhone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactEmail` varchar(254) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
```

- [ ] **Step 2: Local MySQL**

`apps/uppdrag/compose.yml`:

```yaml
# Local MySQL for the uppdrag service. schema.sql is applied on the first
# boot of the volume; `docker compose down -v` to start over.
#
#   docker compose -f apps/uppdrag/compose.yml up -d
#   MYSQL_URL=mysql://uppdrag:uppdrag@127.0.0.1:3306/uppdrag
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: uppdrag
      MYSQL_USER: uppdrag
      MYSQL_PASSWORD: uppdrag
    ports:
      - '3306:3306'
    volumes:
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
      - mysql-data:/var/lib/mysql
volumes:
  mysql-data: {}
```

- [ ] **Step 3: Write the integration spec (self-skipping)**

`apps/uppdrag/src/db.spec.ts`:

```ts
import { afterAll, describe, expect, it } from 'bun:test'
import { SQL } from 'bun'
import { createDb, randomString } from './db'
import type { NewAssignment } from './types'

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

  it('reports health', async () => {
    expect(await db.isHealthy()).toBe(true)
  })
})
```

- [ ] **Step 4: Run it, expect the unit test to fail and the rest to skip**

Run: `bun test apps/uppdrag/src/db.spec.ts`
Expected: FAIL, cannot resolve `./db`.

- [ ] **Step 5: Implement**

`apps/uppdrag/src/db.ts`:

```ts
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
  saveAssignmentComment(id: string, comment: string, now?: number): Promise<void>
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
  deleted: row.deleted === null || row.deleted === undefined ? null : Number(row.deleted),
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
      const rows = await sql<Row[]>`SELECT id FROM assignment WHERE slackId IS NULL`
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
```

- [ ] **Step 6: The in-memory fake for later specs**

`apps/uppdrag/src/test/fake-db.ts`:

```ts
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
          input.clientHourlyRate === null ? null : String(input.clientHourlyRate),
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
      return [...assignments.values()].filter((a) => a.slackId === null).map((a) => a.id)
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
```

- [ ] **Step 7: Run unit tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: pass; the `createDb` describe is skipped.

- [ ] **Step 8: Run the integration spec against the local MySQL**

```bash
docker compose -f apps/uppdrag/compose.yml up -d
sleep 20
MYSQL_URL=mysql://uppdrag:uppdrag@127.0.0.1:3306/uppdrag bun test apps/uppdrag/src/db.spec.ts
```
Expected: 5 pass. If the mysql adapter rejects the `SELECT COUNT(*) + 1` subquery or returns bigints, fix `db.ts` here (the spec pins the contract), not the callers.

- [ ] **Step 9: Commit**

```bash
git add apps/uppdrag/schema.sql apps/uppdrag/compose.yml apps/uppdrag/src/db.ts apps/uppdrag/src/db.spec.ts apps/uppdrag/src/test/fake-db.ts
git commit -m "feat(uppdrag): model on Bun.SQL, schema migration, local mysql

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Slack client, propagation and member count

**Files:**
- Create: `apps/uppdrag/src/slack.ts`, `apps/uppdrag/src/slack.spec.ts`

**Interfaces:**
- Consumes: `Db` (`db.ts`), `createFakeDb`/`fakeAssignment` (`test/fake-db.ts`), `fillTemplate`, `escapeMrkdwn`, `TEMPLATES` (`templates.ts`), `Logger`.
- Produces:
  - `type SlackResult = { ok: true; ts: string; channel: string } | { ok: false; error: string }`
  - `interface SlackClient { postMessage(message: { channel: string; text: string; thread_ts?: string; reply_broadcast?: boolean }): Promise<SlackResult>; updateMessage(channel: string, ts: string, text: string): Promise<SlackResult>; channelMemberCount(channel: string): Promise<number | null> }`
  - `createSlackClient(token: string, fetchImpl?: typeof fetch): SlackClient`
  - `interface SlackPropagation { sync(): Promise<void>; propagateAssignment(id: string): Promise<void>; propagateAssignmentComments(id: string): Promise<void>; propagateAssignmentDeletion(id: string): Promise<void> }`
  - `createSlackPropagation(deps: { db: Db; slack: SlackClient; siteUrl: string; log: Logger }): SlackPropagation`
  - `createMemberCountCache(deps: { slack: SlackClient; channel: string; log: Logger; intervalMs?: number }): { get(): number | null; refresh(): Promise<void>; start(): Promise<void> }`

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/slack.spec.ts`:

```ts
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
    const client = createSlackClient('xoxb', fetchImpl as unknown as typeof fetch)
    const result = await client.postMessage({
      channel: '#broker',
      text: 'hej',
      thread_ts: '1.0',
      reply_broadcast: true,
    })
    expect(result).toEqual({ ok: true, ts: '1.1', channel: 'C1' })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://slack.com/api/chat.postMessage')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer xoxb')
    expect(JSON.parse(String(init.body))).toEqual({
      channel: '#broker',
      text: 'hej',
      thread_ts: '1.0',
      reply_broadcast: true,
    })
  })

  it('surfaces Slack errors and transport failures as ok: false', async () => {
    const failing = createSlackClient(
      'x',
      (async () => jsonResponse({ ok: false, error: 'channel_not_found' })) as typeof fetch,
    )
    expect(await failing.updateMessage('C1', '1.1', 'x')).toEqual({
      ok: false,
      error: 'channel_not_found',
    })
    const broken = createSlackClient('x', (async () => {
      throw new Error('ECONNRESET')
    }) as typeof fetch)
    expect(await broken.postMessage({ channel: 'C', text: 't' })).toEqual({
      ok: false,
      error: 'ECONNRESET',
    })
  })

  it('reads the member count from conversations.info', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ ok: true, channel: { num_members: 4200 } }),
    )
    const client = createSlackClient('xoxb', fetchImpl as unknown as typeof fetch)
    expect(await client.channelMemberCount('C8P11NBEF')).toBe(4200)
    const [url] = fetchImpl.mock.calls[0] as unknown as [string]
    expect(url).toBe(
      'https://slack.com/api/conversations.info?channel=C8P11NBEF&include_num_members=true',
    )
    const failing = createSlackClient(
      'x',
      (async () => jsonResponse({ ok: false, error: 'invalid_auth' })) as typeof fetch,
    )
    expect(await failing.channelMemberCount('C')).toBeNull()
  })
})

// A scripted client: each call pops the next result, and every call is
// recorded so the specs can assert on what reached Slack.
const scriptedClient = (script: SlackResult[]) => {
  const calls: { method: string; args: unknown[] }[] = []
  const next = (method: string, args: unknown[]): SlackResult => {
    calls.push({ method, args })
    return script.shift() ?? { ok: true, ts: `auto-${calls.length}`, channel: 'C1' }
  }
  const client: SlackClient = {
    postMessage: async (message) => next('postMessage', [message]),
    updateMessage: async (channel, ts, text) => next('updateMessage', [channel, ts, text]),
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
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
    await slack.propagateAssignment(a.id)
    expect(calls.map((c) => c.method)).toEqual(['postMessage', 'postMessage'])
    expect(calls[0].args[0]).toMatchObject({ channel: '#broker' })
    expect((calls[0].args[0] as { text: string }).text).toStartWith('*Frontendutvecklare*')
    expect(calls[1].args[0]).toMatchObject({ channel: '#broker', thread_ts: '1.0' })
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
    const { client, calls } = scriptedClient([{ ok: true, ts: '1.1', channel: 'C1' }])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
    const { client, calls } = scriptedClient([{ ok: false, error: 'channel_not_found' }])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log })
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
    const { client, calls } = scriptedClient([{ ok: true, ts: '1.6', channel: 'C1' }])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
    const terminal = fakeAssignment({ slackId: '1.0', slackChannelId: 'C1', deleted: 5 })
    const retry = fakeAssignment({ slackId: '2.0', slackChannelId: 'C1', deleted: 5 })
    db.seed(terminal)
    db.seed(retry)
    const { client } = scriptedClient([
      { ok: false, error: 'message_not_found' },
      { ok: false, error: 'ratelimited' },
    ])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
    await slack.propagateAssignmentDeletion(terminal.id)
    await slack.propagateAssignmentDeletion(retry.id)
    expect(db.assignments.get(terminal.id)?.slackDeleted).toBe(true)
    expect(db.assignments.get(retry.id)?.slackDeleted).toBe(false)
  })

  it('keeps a deletion pending while a comment is still unposted', async () => {
    const db = createFakeDb()
    const a = fakeAssignment({ slackId: '1.0', slackChannelId: 'C1', deleted: 5 })
    db.seed(a, [{ id: 1, comment: 'x', created: 1, slackId: null }])
    const { client } = scriptedClient([])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
    await slack.propagateAssignment(a.id)
    expect(calls.map((c) => c.method)).toEqual([
      'postMessage',
      'postMessage',
      'updateMessage',
      'updateMessage',
    ])
    expect(db.assignments.get(a.id)?.slackDeleted).toBe(true)
  })

  it('sync posts everything unposted and rewrites everything pending', async () => {
    const db = createFakeDb()
    const unposted = fakeAssignment()
    const pending = fakeAssignment({ slackId: '1.0', slackChannelId: 'C1', deleted: 5 })
    db.seed(unposted)
    db.seed(pending)
    const { client, calls } = scriptedClient([])
    const slack = createSlackPropagation({ db, slack: client, siteUrl: SITE, log: noLog })
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
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/slack.spec.ts`
Expected: FAIL, cannot resolve `./slack`.

- [ ] **Step 3: Implement**

`apps/uppdrag/src/slack.ts`:

```ts
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
    updateMessage: (channel, ts, text) => post('chat.update', { channel, ts, text }),

    async channelMemberCount(channel) {
      try {
        const params = new URLSearchParams({ channel, include_num_members: 'true' })
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
        (await updateMessage(channel, assignment.slackId, TEMPLATES.slackAssignmentDeleted)) &&
        done
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
        log(`Failed to post the thread for assignment ${id} to Slack: ${result.error}`)
      }
    }
    // It may have been deleted while the posts above were in flight.
    if (assignment.deleted !== null) {
      await propagateAssignmentDeletion(id)
    }
  }

  const propagateAssignmentComments = async (id: string) => {
    const assignment = await db.getAssignment(id)
    if (assignment === null || assignment.slackId === null || assignment.deleted !== null) {
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
        text: render(TEMPLATES.slackAssignmentComment, { comment: comment.comment }),
      })
      if (result.ok) {
        await db.setAssignmentCommentSlackId(id, comment.id, result.ts)
      } else {
        log(`Failed to post comment ${comment.id} for assignment ${id}: ${result.error}`)
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

  return { sync, propagateAssignment, propagateAssignmentComments, propagateAssignmentDeletion }
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
```

- [ ] **Step 4: Run tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/uppdrag/src/slack.ts apps/uppdrag/src/slack.spec.ts
git commit -m "feat(uppdrag): slack client, propagation and member count on fetch

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Email

**Files:**
- Create: `apps/uppdrag/src/email.ts`, `apps/uppdrag/src/email.spec.ts`

**Interfaces:**
- Consumes: `Config['smtp']`, `Config['email']`, `fillTemplate`, `TEMPLATES`, `Assignment`, `Logger`.
- Produces: `interface MailTransport { sendMail(options: { from: string; to: string; bcc?: string; subject: string; text: string }): Promise<unknown> }`, `createTransport(smtp): MailTransport`, `interface Mailer { sendConfirmation(assignment: Assignment): Promise<void> }`, `createMailer(config: Pick<Config, 'email' | 'siteUrl'>, transport: MailTransport, log: Logger): Mailer`, `CONFIRMATION_SUBJECT`.

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/email.spec.ts`:

```ts
import { describe, expect, it, jest } from 'bun:test'
import { CONFIRMATION_SUBJECT, createMailer } from './email'
import { fakeAssignment } from './test/fake-db'

const SITE = 'https://frilansaresverige.se'

describe('createMailer', () => {
  it('sends the confirmation to the sender with the manage link', async () => {
    const sendMail = jest.fn(async () => ({}))
    const mailer = createMailer(
      { email: { from: 'FS <hej@fs.se>', bcc: 'arkiv@fs.se', toOverride: null }, siteUrl: SITE },
      { sendMail },
      () => {},
    )
    const assignment = fakeAssignment({ id: 'ABCDEFGHIJKLMNOP' })
    await mailer.sendConfirmation(assignment)
    expect(sendMail).toHaveBeenCalledTimes(1)
    const options = sendMail.mock.calls[0][0] as Record<string, string>
    expect(options).toMatchObject({
      from: 'FS <hej@fs.se>',
      to: 'kim@broker.se',
      bcc: 'arkiv@fs.se',
      subject: CONFIRMATION_SUBJECT,
    })
    expect(options.text).toContain("rubriken 'Frontendutvecklare'")
    expect(options.text).toContain(`${SITE}/tipsa/hantera/ABCDEFGHIJKLMNOP`)
  })

  it('honours the dev override and omits an unset bcc', async () => {
    const sendMail = jest.fn(async () => ({}))
    const mailer = createMailer(
      { email: { from: 'f', bcc: null, toOverride: 'dev@fs.se' }, siteUrl: SITE },
      { sendMail },
      () => {},
    )
    await mailer.sendConfirmation(fakeAssignment())
    const options = sendMail.mock.calls[0][0] as Record<string, unknown>
    expect(options.to).toBe('dev@fs.se')
    expect('bcc' in options).toBe(false)
  })

  it('logs instead of throwing when the transport fails', async () => {
    const log = jest.fn()
    const mailer = createMailer(
      { email: { from: 'f', bcc: null, toOverride: null }, siteUrl: SITE },
      {
        sendMail: async () => {
          throw new Error('smtp down')
        },
      },
      log,
    )
    await expect(mailer.sendConfirmation(fakeAssignment())).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/email.spec.ts`
Expected: FAIL, cannot resolve `./email`.

- [ ] **Step 3: Implement**

`apps/uppdrag/src/email.ts`:

```ts
import nodemailer from 'nodemailer'
import type { Config } from './config'
import { fillTemplate, TEMPLATES } from './templates'
import type { Assignment, Logger } from './types'

export interface MailTransport {
  sendMail(options: {
    from: string
    to: string
    bcc?: string
    subject: string
    text: string
  }): Promise<unknown>
}

export interface Mailer {
  sendConfirmation(assignment: Assignment): Promise<void>
}

export const CONFIRMATION_SUBJECT = 'Bekräftelse på publicerat konsultuppdrag'

// Bun has no SMTP client, so this is the one non-native dependency.
export function createTransport(smtp: Config['smtp']): MailTransport {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  })
}

export function createMailer(
  { email, siteUrl }: Pick<Config, 'email' | 'siteUrl'>,
  transport: MailTransport,
  log: Logger,
): Mailer {
  return {
    async sendConfirmation(assignment) {
      try {
        await transport.sendMail({
          from: email.from,
          to: email.toOverride ?? assignment.emailAddress,
          ...(email.bcc ? { bcc: email.bcc } : {}),
          subject: CONFIRMATION_SUBJECT,
          text: fillTemplate(TEMPLATES.confirmation, assignment, siteUrl),
        })
      } catch (error) {
        // The listing is already published; a lost receipt is logged,
        // never surfaced to the client.
        log(`Failed to send the confirmation email for assignment ${assignment.id}`, error)
      }
    },
  }
}
```

- [ ] **Step 4: Run tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: all pass. If tsc complains about the nodemailer default import, switch to `import { createTransport as createSmtpTransport } from 'nodemailer'` and call that.

- [ ] **Step 5: Commit**

```bash
git add apps/uppdrag/src/email.ts apps/uppdrag/src/email.spec.ts
git commit -m "feat(uppdrag): confirmation mail through an injected transport

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Assignment handlers

**Files:**
- Create: `apps/uppdrag/src/assignments.ts`, `apps/uppdrag/src/assignments.spec.ts`

**Interfaces:**
- Consumes: `Db`, `SlackPropagation`, `Mailer`, `contactText`, `parseAssignmentBody`, `parseCommentBody`, `isBlockedSender`, `INVALID_EMAIL_ADDRESS`, `SenderType`, `Logger`.
- Produces:
  - `json(status, body): Response`, `fail(status, error): Response`
  - `interface HandlerDeps { db: Db; slack: SlackPropagation; mailer: Mailer; channels: Record<SenderType, string>; blockedSenderDomains: readonly string[]; log: Logger }`
  - `createAssignmentHandlers(deps): AssignmentHandlers` where `AssignmentHandlers = { create(req: Request): Promise<Response>; get(id: string): Promise<Response>; remove(id: string): Promise<Response>; listComments(id: string): Promise<Response>; createComment(id: string, req: Request): Promise<Response> }`
  - Public GET body: `{ id, senderType, customerName, title, description, location, scope, workForm, contact, clientHourlyRate, deleted: false }` or `{ id, title, deleted: true }`.

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/assignments.spec.ts`:

```ts
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
  const deps: HandlerDeps = {
    db,
    slack,
    mailer,
    channels: { BROKER: '#broker', DIRECT: '#direct' },
    blockedSenderDomains: ['gmail.com'],
    log: () => {},
  }
  return { db, slack, mailer, handlers: createAssignmentHandlers(deps) }
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
    expect(await response.json()).toEqual({ success: false, error: 'Titel is required' })
    const bad = await handlers.create(post({ ...body, emailAddress: 'nope' }))
    expect(await bad.json()).toEqual({ success: false, error: 'INVALID_EMAIL_ADDRESS' })
    const broken = await handlers.create(post('{not json'))
    expect(broken.status).toBe(400)
  })

  it('pretends to accept blocked sender domains', async () => {
    const { db, slack, handlers } = build()
    const response = await handlers.create(post({ ...body, emailAddress: 'a@gmail.com' }))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true, id: null })
    expect(db.assignments.size).toBe(0)
    expect(slack.propagateAssignment).not.toHaveBeenCalled()
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
      deleted: false,
    })
  })

  it('uses the legacy contact for old rows', async () => {
    const { db, handlers } = build()
    const a = fakeAssignment({ contact: 'Ring Kim', contactName: null, scope: null })
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
    const response = await handlers.createComment(a.id, post({ comment: ' Start i maj. ' }))
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
    expect((await handlers.createComment(gone.id, post({ comment: 'x' }))).status).toBe(404)
    expect((await handlers.createComment('NOPE', post({ comment: 'x' }))).status).toBe(404)
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
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/assignments.spec.ts`
Expected: FAIL, cannot resolve `./assignments`.

- [ ] **Step 3: Implement**

`apps/uppdrag/src/assignments.ts`:

```ts
import type { Db } from './db'
import type { Mailer } from './email'
import type { SlackPropagation } from './slack'
import { contactText } from './templates'
import type { Logger, SenderType } from './types'
import { isBlockedSender, parseAssignmentBody, parseCommentBody } from './validate'

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
      const id = await db.saveAssignment(parsed.value, channels[parsed.value.senderType])
      background(`Failed to post assignment ${id} to Slack`, slack.propagateAssignment(id))
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
        comments.map((c) => ({ id: c.id, comment: c.comment, created: c.created })),
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
```

- [ ] **Step 4: Run tests, lint, typecheck**

Run: `bun test apps/uppdrag && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/uppdrag/src/assignments.ts apps/uppdrag/src/assignments.spec.ts
git commit -m "feat(uppdrag): assignment and comment handlers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Routes, auth, redirects and the entrypoint

**Files:**
- Create: `apps/uppdrag/src/server.ts`, `apps/uppdrag/src/server.spec.ts`, `apps/uppdrag/src/index.ts`, `apps/uppdrag/.env.example`

**Interfaces:**
- Consumes: `AssignmentHandlers`, `fail`, `Config`.
- Produces: `createRoutes(deps: { config: Pick<Config, 'apiKey' | 'siteUrl'>; handlers: AssignmentHandlers; isHealthy(): Promise<boolean>; memberCount(): number | null })` returning the object passed to `Bun.serve({ routes })`.

- [ ] **Step 1: Write the failing tests**

`apps/uppdrag/src/server.spec.ts`:

```ts
import { describe, expect, it, jest } from 'bun:test'
import type { BunRequest } from 'bun'
import type { AssignmentHandlers } from './assignments'
import { createRoutes } from './server'

const KEY = 'secret'

// Bun fills params from the route pattern; here they are supplied by hand.
const request = <P extends string>(
  url: string,
  init: RequestInit & { params?: Record<string, string> } = {},
) => {
  const { params = {}, ...rest } = init
  return Object.assign(new Request(url, rest), { params }) as unknown as BunRequest<P>
}

const handlers: AssignmentHandlers = {
  create: jest.fn(async () => Response.json({ success: true, id: 'X' }, { status: 201 })),
  get: jest.fn(async (id: string) => Response.json({ id })),
  remove: jest.fn(async () => Response.json({ success: true })),
  listComments: jest.fn(async () => Response.json([])),
  createComment: jest.fn(async () => Response.json({ success: true }, { status: 201 })),
}

const build = (healthy = true, count: number | null = 4200) =>
  createRoutes({
    config: { apiKey: KEY, siteUrl: 'https://frilansaresverige.se' },
    handlers,
    isHealthy: async () => healthy,
    memberCount: () => count,
  })

const auth = { Authorization: `Bearer ${KEY}` }

describe('createRoutes', () => {
  it('rejects assignment calls without the key', async () => {
    const routes = build()
    const response = await routes['/api/assignments/:id'].GET(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', { params: { id: 'ABC' } }),
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' })
    const wrong = await routes['/api/assignments'].POST(
      request<'/api/assignments'>('http://x/api/assignments', {
        method: 'POST',
        headers: { Authorization: 'Bearer nope' },
      }),
    )
    expect(wrong.status).toBe(401)
    expect(handlers.get).not.toHaveBeenCalled()
  })

  it('dispatches authorised calls with the route params', async () => {
    const routes = build()
    await routes['/api/assignments/:id'].GET(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', { params: { id: 'ABC' }, headers: auth }),
    )
    expect(handlers.get).toHaveBeenCalledWith('ABC')
    await routes['/api/assignments/:id'].DELETE(
      request<'/api/assignments/:id'>('http://x/api/assignments/ABC', {
        method: 'DELETE',
        params: { id: 'ABC' },
        headers: auth,
      }),
    )
    expect(handlers.remove).toHaveBeenCalledWith('ABC')
    await routes['/api/assignments/:id/comments'].GET(
      request<'/api/assignments/:id/comments'>('http://x/api/assignments/ABC/comments', { params: { id: 'ABC' }, headers: auth }),
    )
    expect(handlers.listComments).toHaveBeenCalledWith('ABC')
    const req = request<'/api/assignments/:id/comments'>('http://x/api/assignments/ABC/comments', {
      method: 'POST',
      params: { id: 'ABC' },
      headers: auth,
    })
    await routes['/api/assignments/:id/comments'].POST(req)
    expect(handlers.createComment).toHaveBeenCalledWith('ABC', req)
    const created = await routes['/api/assignments'].POST(
      request<'/api/assignments'>('http://x/api/assignments', { method: 'POST', headers: auth }),
    )
    expect(created.status).toBe(201)
  })

  it('reports health from the database', async () => {
    expect((await build(true)['/api/health'].GET()).status).toBe(200)
    expect((await build(false)['/api/health'].GET()).status).toBe(500)
  })

  it('serves the member count as text, 503 before the first refresh', async () => {
    const ok = await build(true, 4200)['/api/member-count'].GET()
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toStartWith('text/plain')
    expect(await ok.text()).toBe('4200')
    expect((await build(true, null)['/api/member-count'].GET()).status).toBe(503)
  })

  it('redirects old edit links and the root to the site', async () => {
    const routes = build()
    const edit = routes['/assignments/:id'].GET(
      request<'/assignments/:id'>('http://x/assignments/ABC', { params: { id: 'ABC' } }),
    )
    expect(edit.status).toBe(301)
    expect(edit.headers.get('location')).toBe('https://frilansaresverige.se/tipsa/hantera/ABC')
    const root = routes['/'].GET()
    expect(root.status).toBe(301)
    expect(root.headers.get('location')).toBe('https://frilansaresverige.se/tipsa')
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/uppdrag/src/server.spec.ts`
Expected: FAIL, cannot resolve `./server`.

- [ ] **Step 3: Implement the routes**

`apps/uppdrag/src/server.ts`:

```ts
import type { BunRequest } from 'bun'
import { type AssignmentHandlers, fail } from './assignments'
import type { Config } from './config'
import { manageURL } from './templates'

export interface ServerDeps {
  config: Pick<Config, 'apiKey' | 'siteUrl'>
  handlers: AssignmentHandlers
  isHealthy(): Promise<boolean>
  memberCount(): number | null
}

// The routes table for Bun.serve. Assignment endpoints require the shared
// key so the site's rate limiter and honeypot cannot be bypassed by calling
// the service directly; health, member-count and the redirects stay open.
export function createRoutes({ config, handlers, isHealthy, memberCount }: ServerDeps) {
  const authorized = (req: Request) =>
    req.headers.get('authorization') === `Bearer ${config.apiKey}`

  const guarded =
    <P extends string>(handler: (req: BunRequest<P>) => Promise<Response>) =>
    (req: BunRequest<P>): Promise<Response> =>
      authorized(req) ? handler(req) : Promise.resolve(fail(401, 'Unauthorized'))

  return {
    '/api/assignments': {
      POST: guarded<'/api/assignments'>((req) => handlers.create(req)),
    },
    '/api/assignments/:id': {
      GET: guarded<'/api/assignments/:id'>((req) => handlers.get(req.params.id)),
      DELETE: guarded<'/api/assignments/:id'>((req) => handlers.remove(req.params.id)),
    },
    '/api/assignments/:id/comments': {
      GET: guarded<'/api/assignments/:id/comments'>((req) =>
        handlers.listComments(req.params.id),
      ),
      POST: guarded<'/api/assignments/:id/comments'>((req) =>
        handlers.createComment(req.params.id, req),
      ),
    },
    '/api/health': {
      GET: async () => new Response(null, { status: (await isHealthy()) ? 200 : 500 }),
    },
    '/api/member-count': {
      GET: () => {
        const count = memberCount()
        return count === null
          ? new Response(null, { status: 503 })
          : new Response(String(count), {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
      },
    },
    // Edit links in already-sent receipt mails point at the old domain.
    '/assignments/:id': {
      GET: (req: BunRequest<'/assignments/:id'>) =>
        Response.redirect(manageURL(config.siteUrl, req.params.id), 301),
    },
    '/': {
      GET: () => Response.redirect(`${config.siteUrl}/tipsa`, 301),
    },
  }
}
```

- [ ] **Step 4: Run the spec, lint, typecheck**

Run: `bun test apps/uppdrag/src/server.spec.ts && bun run check:fix && bun run --filter '@frilansaresverige/uppdrag' typecheck`
Expected: pass. If tsc rejects the `Object.assign(new Request(...), { params })` cast in the spec, cast through `unknown` (already done) and keep going.

- [ ] **Step 5: The entrypoint**

`apps/uppdrag/src/index.ts`:

```ts
import { createAssignmentHandlers } from './assignments'
import { loadConfig } from './config'
import { createDb } from './db'
import { createMailer, createTransport } from './email'
import { createRoutes } from './server'
import { createMemberCountCache, createSlackClient, createSlackPropagation } from './slack'
import type { Logger } from './types'

const log: Logger = (message, detail) => console.error(message, detail ?? '')

const config = loadConfig()
const db = createDb(config.mysqlUrl)
const slackClient = createSlackClient(config.slack.token)
const slack = createSlackPropagation({ db, slack: slackClient, siteUrl: config.siteUrl, log })
const mailer = createMailer(config, createTransport(config.smtp), log)
const memberCount = createMemberCountCache({
  slack: slackClient,
  channel: config.slack.memberCountChannel,
  log,
})
const handlers = createAssignmentHandlers({
  db,
  slack,
  mailer,
  channels: config.slack.channels,
  blockedSenderDomains: config.blockedSenderDomains,
  log,
})

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  routes: createRoutes({
    config,
    handlers,
    isHealthy: () => db.isHealthy(),
    memberCount: () => memberCount.get(),
  }),
  fetch: () => new Response(null, { status: 404 }),
  error(error) {
    log('Unhandled error', error)
    return new Response(null, { status: 500 })
  },
})

console.log(`uppdrag listening on http://${server.hostname}:${server.port}`)

// Anything that never reached Slack (a crash mid-post, an outage) is
// retried on every start; the member count is refreshed hourly.
slack.sync().catch((error) => log('Failed to sync assignments to Slack on startup', error))
void memberCount.start()
```

- [ ] **Step 6: Env example**

`apps/uppdrag/.env.example`:

```bash
# Copy to apps/uppdrag/.env (gitignored; Bun loads it automatically when
# the service starts from that directory, and `bun run dev:uppdrag` does).
# Every variable without a default is required: the service refuses to
# start and names the missing one.

# Listen address. Defaults: 0.0.0.0 and 8989.
HOST=
PORT=

# MySQL, see compose.yml for the local one.
MYSQL_URL=mysql://uppdrag:uppdrag@127.0.0.1:3306/uppdrag

# SMTP for the receipt mail. SMTP_PORT defaults to 465, SMTP_SECURE to
# true (set to "false" for STARTTLS on 587).
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Frilansare Sverige <uppdrag@frilansaresverige.se>"
# Optional copy of every receipt.
EMAIL_BCC=
# Dev only: when set, every receipt goes here instead of to the sender.
EMAIL_TO_OVERRIDE=

# Slack bot token with chat:write, chat:write.public and channels:read.
SLACK_BOT_TOKEN=
# Channel names the listings are posted to, by sender type.
SLACK_CHANNEL_BROKER=
SLACK_CHANNEL_DIRECT=
# Channel id whose member count /api/member-count serves. Default C8P11NBEF.
SLACK_MEMBER_COUNT_CHANNEL=

# Base URL of the site, for the manage link in the receipt and the
# redirects from the old domain.
SITE_URL=http://localhost:3000

# Shared secret; apps/web sends it as a bearer token. Same value as
# UPPDRAG_API_KEY in apps/web/.env.local. Generate one with `openssl rand -hex 32`.
UPPDRAG_API_KEY=

# Sender domains whose submissions get a 201 and are dropped (inherited).
# Default gmail.com,partna.se.
BLOCKED_SENDER_DOMAINS=
```

Add `apps/uppdrag/.env` to the root `.gitignore` under "# local env files" (the root ignore list only covers `.env.local` variants, and this file holds real secrets).

- [ ] **Step 7: Smoke-run against the local MySQL**

```bash
cp apps/uppdrag/.env.example apps/uppdrag/.env
# fill MYSQL_URL (compose default works), SMTP_* and SLACK_* with anything non-empty,
# UPPDRAG_API_KEY=devkey, SITE_URL=http://localhost:3000
docker compose -f apps/uppdrag/compose.yml up -d
bun run dev:uppdrag &
sleep 2
curl -i http://localhost:8989/api/health          # 200
curl -i http://localhost:8989/api/member-count    # 503 (no real Slack token)
curl -i http://localhost:8989/assignments/ABC     # 301 to http://localhost:3000/tipsa/hantera/ABC
curl -i -X POST http://localhost:8989/api/assignments -H 'Content-Type: application/json' -d '{}'   # 401
kill %1
```

- [ ] **Step 8: Lint, typecheck, full test, commit**

Run: `bun run check:fix && bun run typecheck && bun test`
Expected: clean across every workspace.

```bash
git add .gitignore apps/uppdrag/src/server.ts apps/uppdrag/src/server.spec.ts apps/uppdrag/src/index.ts apps/uppdrag/.env.example
git commit -m "feat(uppdrag): bun.serve routes with bearer auth, health, member count and redirects

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: The proxy in apps/web

**Files:**
- Create: `apps/web/lib/uppdrag-proxy.server.ts`, `apps/web/lib/uppdrag-proxy.server.spec.ts`, `apps/web/pages/api/uppdrag/assignments.ts`, `apps/web/pages/api/uppdrag/assignments/[id].ts`, `apps/web/pages/api/uppdrag/assignments/[id]/comments.ts`

**Interfaces:**
- Consumes: `HONEYPOT_FIELD` (`lib/form-fields.ts`), `checkRateLimit`/`resetRateLimit` (`lib/rate-limit.server.ts`), `clientKey` (`lib/slack-form.server.ts`).
- Produces: `type ProxyMethod = 'GET' | 'POST' | 'DELETE'`, `interface UppdragProxyRoute { methods: readonly ProxyMethod[]; path: (query: NextApiRequest['query']) => string | null }`, `createUppdragProxy(route, deps?: { env?; fetchImpl?; now?; log? })` returning a Pages Router handler, `assignmentIdFrom(query): string | null`, `ASSIGNMENT_ID = /^[A-Z0-9]{16}$/`.
- Env read: `UPPDRAG_API_URL`, `UPPDRAG_API_KEY`.

- [ ] **Step 1: Write the failing tests**

`apps/web/lib/uppdrag-proxy.server.spec.ts`:

```ts
import { beforeEach, describe, expect, it, jest } from 'bun:test'
import type { NextApiRequest, NextApiResponse } from 'next'
import { resetRateLimit } from './rate-limit.server'
import {
  assignmentIdFrom,
  createUppdragProxy,
  type UppdragProxyRoute,
} from './uppdrag-proxy.server'

const env = { UPPDRAG_API_URL: 'http://uppdrag:8989/', UPPDRAG_API_KEY: 'k' }

const makeReq = (
  overrides: Partial<{
    method: string
    body: unknown
    query: Record<string, string>
    headers: Record<string, string>
  }> = {},
) =>
  ({
    method: overrides.method ?? 'POST',
    body: overrides.body,
    query: overrides.query ?? {},
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      ...overrides.headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as NextApiRequest

const makeRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(key: string, value: string) {
      res.headers[key] = value
      return res
    },
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
  }
  return res as typeof res & NextApiResponse
}

const upstream = (status: number, body: string) =>
  jest.fn(async () => new Response(body, { status })) as unknown as jest.Mock

const create = { methods: ['POST'] as const, path: () => '/api/assignments' }
const byId = {
  methods: ['GET', 'DELETE'] as const,
  path: (query: NextApiRequest['query']) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}`
  },
}

describe('assignmentIdFrom', () => {
  it('accepts only 16 uppercase alphanumerics', () => {
    expect(assignmentIdFrom({ id: 'ABCDEFGHIJKLMNOP' })).toBe('ABCDEFGHIJKLMNOP')
    expect(assignmentIdFrom({ id: 'abc' })).toBeNull()
    expect(assignmentIdFrom({ id: ['A', 'B'] })).toBeNull()
    expect(assignmentIdFrom({})).toBeNull()
  })
})

describe('createUppdragProxy', () => {
  beforeEach(() => resetRateLimit())

  const build = (route: UppdragProxyRoute = create, fetchImpl = upstream(201, '{"success":true,"id":"X"}'), overrides = {}) => ({
    handler: createUppdragProxy(route, {
      env: { ...env, ...overrides },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      log: () => {},
    }),
    fetchImpl,
  })

  it('rejects methods the route does not list', async () => {
    const { handler, fetchImpl } = build(byId)
    const res = makeRes()
    await handler(makeReq({ method: 'POST', query: { id: 'ABCDEFGHIJKLMNOP' } }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('GET, DELETE')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('404s an invalid id before calling upstream', async () => {
    const { handler, fetchImpl } = build(byId)
    const res = makeRes()
    await handler(makeReq({ method: 'GET', query: { id: 'nope' } }), res)
    expect(res.statusCode).toBe(404)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('500s when the service is not configured', async () => {
    const { handler, fetchImpl } = build(create, undefined, { UPPDRAG_API_KEY: '' })
    const res = makeRes()
    await handler(makeReq({ body: {} }), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      success: false,
      error: 'The form is not configured on the server',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('requires JSON on POST, swallows the honeypot and rate-limits writes', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ headers: { 'content-type': 'text/plain' } }), res)
    expect(res.statusCode).toBe(415)

    const trap = makeRes()
    await handler(makeReq({ body: { website: 'http://spam' } }), trap)
    expect(trap.statusCode).toBe(200)
    expect(trap.body).toEqual({ success: true })
    expect(fetchImpl).not.toHaveBeenCalled()

    for (let i = 0; i < 5; i++) {
      await handler(makeReq({ body: { title: 'x' } }), makeRes())
    }
    const limited = makeRes()
    await handler(makeReq({ body: { title: 'x' } }), limited)
    expect(limited.statusCode).toBe(429)
    expect(limited.headers['Retry-After']).toBe('600')
  })

  it('forwards with the key and client ip, passing status and body through', async () => {
    const { handler, fetchImpl } = build()
    const res = makeRes()
    await handler(makeReq({ body: { title: 'x', website: '' } }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ success: true, id: 'X' })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://uppdrag:8989/api/assignments')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer k')
    expect(init.headers['X-Forwarded-For']).toBe('203.0.113.1')
    expect(JSON.parse(init.body)).toEqual({ title: 'x' })
  })

  it('forwards GET without a body and does not rate-limit it', async () => {
    const fetchImpl = upstream(200, '{"id":"ABCDEFGHIJKLMNOP","deleted":false}')
    const { handler } = build(byId, fetchImpl)
    for (let i = 0; i < 7; i++) {
      const res = makeRes()
      await handler(makeReq({ method: 'GET', query: { id: 'ABCDEFGHIJKLMNOP' } }), res)
      expect(res.statusCode).toBe(200)
    }
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://uppdrag:8989/api/assignments/ABCDEFGHIJKLMNOP')
    expect(init.body).toBeUndefined()
  })

  it('passes upstream errors through and 502s when unreachable or non-JSON', async () => {
    const { handler } = build(create, upstream(400, '{"success":false,"error":"Titel is required"}'))
    const res = makeRes()
    await handler(makeReq({ body: { title: '' } }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, error: 'Titel is required' })

    const down = createUppdragProxy(create, {
      env,
      fetchImpl: (async () => {
        throw new Error('ECONNREFUSED')
      }) as typeof fetch,
      log: () => {},
    })
    const downRes = makeRes()
    await down(makeReq({ body: { title: 'x' } }), downRes)
    expect(downRes.statusCode).toBe(502)

    const { handler: html } = build(create, upstream(500, '<html>oops</html>'))
    const htmlRes = makeRes()
    await html(makeReq({ body: { title: 'x' } }), htmlRes)
    expect(htmlRes.statusCode).toBe(502)
    expect(htmlRes.body).toMatchObject({ success: false })
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/web/lib/uppdrag-proxy.server.spec.ts`
Expected: FAIL, cannot resolve `./uppdrag-proxy.server`.

- [ ] **Step 3: Implement**

`apps/web/lib/uppdrag-proxy.server.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { HONEYPOT_FIELD } from './form-fields'
import { checkRateLimit } from './rate-limit.server'
import { clientKey } from './slack-form.server'

// Forwards the /api/uppdrag/* routes to the uppdrag service over the
// Docker network. The browser never sees the service: this is where the
// honeypot and per-IP rate limit guard the writes, and the shared key
// means the service refuses anything that did not come through here.

export type ProxyMethod = 'GET' | 'POST' | 'DELETE'

export interface UppdragProxyRoute {
  methods: readonly ProxyMethod[]
  /** Upstream path for this request, or null when the query is invalid. */
  path: (query: NextApiRequest['query']) => string | null
}

export interface ProxyDeps {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  now?: () => number
  log?: (message: string, detail?: unknown) => void
}

export const ASSIGNMENT_ID = /^[A-Z0-9]{16}$/

export const assignmentIdFrom = (query: NextApiRequest['query']): string | null => {
  const id = query.id
  return typeof id === 'string' && ASSIGNMENT_ID.test(id) ? id : null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const NOT_DELIVERED = 'The submission could not be delivered, please try again'

export function createUppdragProxy(
  route: UppdragProxyRoute,
  {
    env = process.env,
    fetchImpl = fetch,
    now = Date.now,
    log = (message, detail) => console.error(message, detail ?? ''),
  }: ProxyDeps = {},
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const method = (req.method ?? 'GET') as ProxyMethod
    if (!route.methods.includes(method)) {
      res.setHeader('Allow', route.methods.join(', '))
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const path = route.path(req.query)
    if (path === null) {
      res.status(404).json({ success: false, error: 'Not found' })
      return
    }

    const base = env.UPPDRAG_API_URL?.replace(/\/+$/, '')
    const key = env.UPPDRAG_API_KEY
    if (!base || !key) {
      log('UPPDRAG_API_URL or UPPDRAG_API_KEY is not set; refusing the request')
      res.status(500).json({
        success: false,
        error: 'The form is not configured on the server',
      })
      return
    }

    const write = method !== 'GET'
    let body: Record<string, unknown> | undefined
    if (write) {
      if (method === 'POST') {
        // A cross-site HTML form can POST urlencoded data without CORS;
        // the site's own forms always send JSON.
        const contentType = String(req.headers['content-type'] ?? '')
        if (!contentType.toLowerCase().startsWith('application/json')) {
          res.status(415).json({
            success: false,
            error: 'Content-Type must be application/json',
          })
          return
        }
        if (isRecord(req.body)) {
          const { [HONEYPOT_FIELD]: honeypot, ...rest } = req.body
          if (String(honeypot ?? '').trim() !== '') {
            // Bots get a success so they believe it worked.
            res.status(200).json({ success: true })
            return
          }
          body = rest
        }
      }
      if (!checkRateLimit(clientKey(req), undefined, now())) {
        res.setHeader('Retry-After', '600')
        res.status(429).json({
          success: false,
          error: 'Too many submissions, please try again later',
        })
        return
      }
    }

    let upstream: Response
    try {
      upstream = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'X-Forwarded-For': clientKey(req),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error) {
      log('The uppdrag service could not be reached', error)
      res.status(502).json({ success: false, error: NOT_DELIVERED })
      return
    }

    const text = await upstream.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      log(`Unexpected response from the uppdrag service: ${upstream.status} ${text.slice(0, 200)}`)
      res.status(502).json({ success: false, error: NOT_DELIVERED })
      return
    }
    res.status(upstream.status).json(payload)
  }
}
```

- [ ] **Step 4: The three API routes**

`apps/web/pages/api/uppdrag/assignments.ts`:

```ts
import { createUppdragProxy } from '../../../lib/uppdrag-proxy.server'

// POST: publish a listing. The body is the service's shape, mapped by
// hooks/useSubmitGigTipForm.ts.
export default createUppdragProxy({
  methods: ['POST'],
  path: () => '/api/assignments',
})
```

`apps/web/pages/api/uppdrag/assignments/[id].ts`:

```ts
import {
  assignmentIdFrom,
  createUppdragProxy,
} from '../../../../lib/uppdrag-proxy.server'

// GET: the public listing for the manage page. DELETE: withdraw it.
export default createUppdragProxy({
  methods: ['GET', 'DELETE'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}`
  },
})
```

`apps/web/pages/api/uppdrag/assignments/[id]/comments.ts`:

```ts
import {
  assignmentIdFrom,
  createUppdragProxy,
} from '../../../../../lib/uppdrag-proxy.server'

// GET: the kompletteringar. POST: add one.
export default createUppdragProxy({
  methods: ['GET', 'POST'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}/comments`
  },
})
```

- [ ] **Step 5: Run tests, lint, typecheck**

Run: `bun test apps/web/lib && bun run check:fix && bun run --filter '@frilansaresverige/web' typecheck`
Expected: pass. `routes.spec.ts` ignores `pages/api`, so no registry entry is needed.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/uppdrag-proxy.server.ts apps/web/lib/uppdrag-proxy.server.spec.ts apps/web/pages/api/uppdrag
git commit -m "feat(web): proxy the uppdrag service behind /api/uppdrag with honeypot and rate limit

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Point the form hook at the service, retire the webhook route

**Files:**
- Modify: `apps/web/hooks/useSubmitGigTipForm.ts`, `apps/web/hooks/useSubmitGigTipForm.spec.ts`, `apps/web/pages/index.tsx:29-31`, `.env.example`
- Delete: `apps/web/pages/api/submit-gig-tip.ts`

**Interfaces:**
- Consumes: `postForm`, `controlValue` (`hooks/submit-form.ts`), `HONEYPOT_FIELD`.
- Produces: the hook keeps its signature `{ submitForm, data, isLoading, error }` and now reads the extra controls `emailAddress`, `customerOrganizationNumber`, `customerFee` (Task 11 renders them). `RELATION_TO_SENDER_TYPE` exported for the form's preview.

- [ ] **Step 1: Update the spec first**

In `apps/web/hooks/useSubmitGigTipForm.spec.ts`, extend `createMockFormEvent`'s defaults with:

```ts
    emailAddress: { value: 'sender@example.se' },
    customerOrganizationNumber: { value: '' },
    customerFee: { value: '' },
```

and replace the assertions in `should handle successful submission` from `expect(url).toBe(...)` onward with:

```ts
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/uppdrag/assignments')
    expect(JSON.parse(init.body)).toEqual({
      senderType: 'DIRECT',
      emailAddress: 'sender@example.se',
      title: 'title',
      location: 'location',
      customerName: 'clientName',
      description: 'description',
      scope: 'Heltid',
      workForm: '',
      clientHourlyRate: '1000',
      contactName: 'contactName',
      contactPhone: '0701234567',
      contactEmail: 'contact@example.se',
      customerOrganizationNumber: '',
      customerFee: '',
      website: '',
    })
```

Add one test after it:

```ts
  it('maps a broker relation and passes the broker fields', async () => {
    const fetchMock = mockFetch({ status: 201, body: { success: true, id: 'X' } })
    const { result } = renderHook(() => useSubmitGigTipForm())
    await act(async () => {
      await result.current.submitForm(
        forceType<FormEvent>(
          createMockFormEvent({
            relation: { value: 'formedlare' },
            customerOrganizationNumber: { value: '556677-8899' },
            customerFee: { value: '10 %' },
          }),
        ),
      )
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body)).toMatchObject({
      senderType: 'BROKER',
      customerOrganizationNumber: '556677-8899',
      customerFee: '10 %',
    })
  })
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/web/hooks/useSubmitGigTipForm.spec.ts`
Expected: FAIL on the url and body assertions.

- [ ] **Step 3: Rewrite the hook**

`apps/web/hooks/useSubmitGigTipForm.ts`:

```ts
import { type FormEvent, useState } from 'react'
import { HONEYPOT_FIELD } from '../lib/form-fields'
import { controlValue, type FormResult, postForm } from './submit-form'

/** The form's relation values mapped to the stored sender type. */
export const RELATION_TO_SENDER_TYPE: Record<string, 'BROKER' | 'DIRECT'> = {
  formedlare: 'BROKER',
  direktavtal: 'DIRECT',
}

export const useSubmitGigTipForm = () => {
  const [data, setData] = useState<FormResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) {
      return
    }
    setIsLoading(true)

    const target = event.target
    // The arbetsform checkboxes share a name and only checked ones land
    // in FormData, so reading them there gives the selected set directly.
    // (The instanceof guard keeps unit tests with plain-object mock
    // targets working.)
    const workForm =
      target instanceof HTMLFormElement
        ? new FormData(target).getAll('arbetsform').map(String).join(', ')
        : ''
    // Radix RadioGroup renders hidden radio inputs, so the named form
    // control is a RadioNodeList whose .value is the checked item's value.
    // The keys are the uppdrag service's, not the form's.
    const relation = controlValue(target, 'relation')
    const requestBody = {
      senderType: RELATION_TO_SENDER_TYPE[relation] ?? relation,
      emailAddress: controlValue(target, 'emailAddress'),
      title: controlValue(target, 'title'),
      location: controlValue(target, 'location'),
      customerName: controlValue(target, 'clientName'),
      description: controlValue(target, 'description'),
      scope: controlValue(target, 'omfattning'),
      workForm,
      clientHourlyRate: controlValue(target, 'minRate'),
      contactName: controlValue(target, 'contactName'),
      contactPhone: controlValue(target, 'contactPhone'),
      contactEmail: controlValue(target, 'contactEmail'),
      customerOrganizationNumber: controlValue(target, 'customerOrganizationNumber'),
      customerFee: controlValue(target, 'customerFee'),
      [HONEYPOT_FIELD]: controlValue(target, HONEYPOT_FIELD),
    }

    try {
      setData(await postForm('/api/uppdrag/assignments', requestBody))
      setError(null)
    } catch (e) {
      setError(e)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return { submitForm, data, isLoading, error }
}
```

- [ ] **Step 4: Retire the webhook route and its env**

```bash
git rm apps/web/pages/api/submit-gig-tip.ts
```

In `.env.example`, delete the `SLACK_GIG_TIP_WEBHOOK_URL` block (the comment lines and the variable) and the `API_BASE_URL` block, and append:

```bash
# The uppdrag service (apps/uppdrag) that /tipsa publishes to, and the
# shared key it expects. On the server this is the compose service name;
# locally it is the port `bun run dev:uppdrag` listens on.
#
# WITHOUT THEM: /api/uppdrag/* answers 500 with
# {"success":false,"error":"The form is not configured on the server"}
# and the form on /tipsa shows its error notice. The homepage member
# count falls back to the public domain, then to the text "flera tusen".
UPPDRAG_API_URL=http://localhost:8989
UPPDRAG_API_KEY=
```

- [ ] **Step 5: Member count from the internal URL**

In `apps/web/pages/index.tsx`, replace lines 29-31 with:

```ts
// On the server the uppdrag service is reached over the Docker network;
// a checkout without the env still gets a count from the public domain.
const UPPDRAG_API_URL =
  process.env.UPPDRAG_API_URL?.replace(/\/+$/, '') ||
  'https://uppdrag.frilansaresverige.se'
const MEMBER_COUNT_API = `${UPPDRAG_API_URL}/api/member-count`
```

- [ ] **Step 6: Run tests, lint, typecheck**

Run: `bun test apps/web && bun run check:fix && bun run --filter '@frilansaresverige/web' typecheck`
Expected: pass, including `__tests__/index.spec.ts`.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web/hooks apps/web/pages/index.tsx apps/web/pages/api .env.example
git commit -m "feat(web): publish gig tips through the uppdrag service instead of a webhook

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Preview component, broker fields and the preview step

**Files:**
- Create: `apps/web/components/AssignmentPreview.tsx`, `apps/web/components/AssignmentPreview.spec.tsx`
- Modify: `apps/web/components/GigTipForm.tsx`, `apps/web/pages/tipsa/index.tsx`, `apps/web/pages/tipsa/tack.tsx`, `apps/web/components/Faq/tipsa-faq-items.ts`

**Interfaces:**
- Consumes: `RELATION_TO_SENDER_TYPE` (Task 10), `FIELD_CLASSES`, `LABEL_CLASSES`, `EMAIL_PATTERN`, `EMAIL_TITLE` (`components/form-classes.ts`), animate-ui `Checkbox`, `Button`, `Tabs*`.
- Produces:
  - `interface AssignmentView { title: string; description: string; customerName: string; location: string | null; scope: string | null; workForm: string | null; contact: string; senderType: 'BROKER' | 'DIRECT'; clientHourlyRate: string | number | null; deleted: boolean }`
  - `interface CommentView { id: number; comment: string; created: number }`
  - `formatCommentDate(created: number): string`
  - default export `AssignmentPreview({ assignment, comments? })`

- [ ] **Step 1: Write the failing component test**

`apps/web/components/AssignmentPreview.spec.tsx`:

```tsx
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import AssignmentPreview, {
  type AssignmentView,
  formatCommentDate,
} from './AssignmentPreview'

const view: AssignmentView = {
  title: 'Frontendutvecklare',
  description: 'React.\nTypeScript.',
  customerName: 'Acme AB',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: 'Distans',
  contact: 'Kim\n070-123 45 67',
  senderType: 'BROKER',
  clientHourlyRate: '950',
  deleted: false,
}

describe('AssignmentPreview', () => {
  afterEach(() => cleanup())

  it('renders the listing and its comments', () => {
    render(
      <AssignmentPreview
        assignment={view}
        comments={[{ id: 1, comment: 'Start i maj.', created: 1758542400 }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frontendutvecklare')
    expect(screen.getByText('Göteborg')).toBeInTheDocument()
    expect(screen.getByText('950 kr/h')).toBeInTheDocument()
    expect(screen.getByText('Avtal med förmedlare')).toBeInTheDocument()
    expect(screen.getByText('Start i maj.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /^Komplettering den/ })).toBeInTheDocument()
  })

  it('renders the deleted notice instead of the details', () => {
    render(<AssignmentPreview assignment={{ ...view, deleted: true }} />)
    expect(screen.getByText('Denna uppdragsannons har raderats.')).toBeInTheDocument()
    expect(screen.queryByText('Göteborg')).toBeNull()
  })

  it('formats comment timestamps in Swedish', () => {
    expect(formatCommentDate(1758542400)).toMatch(/^den \d{1,2} september 2025 kl\. \d{2}[.:]\d{2}$/)
  })
})
```

- [ ] **Step 2: Run it, expect failure**

Run: `bun test apps/web/components/AssignmentPreview.spec.tsx`
Expected: FAIL, cannot resolve `./AssignmentPreview`.

- [ ] **Step 3: Implement the component**

`apps/web/components/AssignmentPreview.tsx`:

```tsx
export interface AssignmentView {
  title: string
  description: string
  customerName: string
  location: string | null
  scope: string | null
  workForm: string | null
  /** Rendered contact lines, structured or legacy free text. */
  contact: string
  senderType: 'BROKER' | 'DIRECT'
  clientHourlyRate: string | number | null
  deleted: boolean
}

export interface CommentView {
  id: number
  comment: string
  created: number
}

const SENDER_TYPE_LABELS: Record<AssignmentView['senderType'], string> = {
  BROKER: 'Avtal med förmedlare',
  DIRECT: 'Direktavtal med kunden',
}

// "den 22 september 2026 kl. 14.05" (the Intl time separator varies by
// runtime, which is why the spec accepts both).
export const formatCommentDate = (created: number): string =>
  `den ${new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(new Date(created * 1000))}`

const Fact = ({ label, value }: { label: string; value: string | null }) =>
  value ? (
    <div>
      <dt className="text-sm font-bold tracking-wide text-brand-blue/70 uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  ) : null

const SectionHeading = ({ children }: { children: string }) => (
  <h3 className="font-display mt-6 text-sm font-bold tracking-widest uppercase">{children}</h3>
)

// The listing as it appears to the sender: the preview step of the form
// and the manage page both render it, so what they approve is what the
// manage page shows them later.
const AssignmentPreview = ({
  assignment,
  comments = [],
}: {
  assignment: AssignmentView
  comments?: CommentView[]
}) => (
  <article className="rounded-[1.25rem] bg-brand-cream p-6 text-brand-blue md:p-8">
    <h2 className="font-display text-2xl font-extrabold tracking-tight">{assignment.title}</h2>
    {assignment.deleted ? (
      <p className="mt-3 text-brand-blue/70 italic">Denna uppdragsannons har raderats.</p>
    ) : (
      <>
        <dl className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          <Fact label="Plats" value={assignment.location} />
          <Fact label="Omfattning" value={assignment.scope} />
          <Fact label="Arbetsform" value={assignment.workForm} />
          <Fact
            label="Lägsta arvode"
            value={
              assignment.clientHourlyRate === null ? null : `${assignment.clientHourlyRate} kr/h`
            }
          />
          <Fact label="Avtal" value={SENDER_TYPE_LABELS[assignment.senderType]} />
        </dl>
        <SectionHeading>Beskrivning</SectionHeading>
        <p className="mt-1 leading-[1.6] whitespace-pre-wrap">{assignment.description}</p>
        <SectionHeading>Uppdragsgivare</SectionHeading>
        <p className="mt-1">{assignment.customerName}</p>
        <SectionHeading>Kontaktuppgifter</SectionHeading>
        <p className="mt-1 whitespace-pre-wrap">{assignment.contact}</p>
        {comments.map((comment) => (
          <section key={comment.id}>
            <h3 className="font-display mt-6 text-sm font-bold tracking-widest uppercase">
              Komplettering {formatCommentDate(comment.created)}
            </h3>
            <p className="mt-1 leading-[1.6] whitespace-pre-wrap">{comment.comment}</p>
          </section>
        ))}
      </>
    )}
  </article>
)

export default AssignmentPreview
```

- [ ] **Step 4: Run the component spec**

Run: `bun test apps/web/components/AssignmentPreview.spec.tsx`
Expected: 3 pass.

- [ ] **Step 5: Extend the form**

Edit `apps/web/components/GigTipForm.tsx`. Every change is listed; the untouched parts of the file stay as they are.

Imports: add after the `Textarea` import:

```tsx
import AssignmentPreview, { type AssignmentView } from './AssignmentPreview'
```

and add `RELATION_TO_SENDER_TYPE` to the import from `../hooks/useSubmitGigTipForm`. `EMAIL_PATTERN` and `EMAIL_TITLE` are already imported.

`STEPS` becomes four:

```tsx
const STEPS = [
  { value: 'uppdraget', label: '1. Uppdraget' },
  { value: 'villkor', label: '2. Villkor' },
  { value: 'kontakt', label: '3. Kontakt' },
  { value: 'granska', label: '4. Granska' },
]
```

Add after `const paneRefs = ...`:

```tsx
  const formRef = useRef<HTMLFormElement>(null)
  // The relation drives which fields step 3 shows, so it is controlled;
  // Radix still renders the hidden radio input the hook reads.
  const [relation, setRelation] = useState('')
  const [customerFee, setCustomerFee] = useState('')
  const [nonTransparentFee, setNonTransparentFee] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [preview, setPreview] = useState<AssignmentView | null>(null)
  const isBroker = relation === 'formedlare'

  // Reads the current answers off the form for the preview step. The
  // panes stay mounted, so every field is in the DOM.
  const snapshot = (): { view: AssignmentView; contactEmail: string } | null => {
    const form = formRef.current
    if (!form) {
      return null
    }
    const data = new FormData(form)
    const read = (name: string) => String(data.get(name) ?? '').trim()
    const contactEmail = read('contactEmail')
    return {
      contactEmail,
      view: {
        title: read('title'),
        description: read('description'),
        customerName: read('clientName'),
        location: read('location') || null,
        scope: read('omfattning') || null,
        workForm: data.getAll('arbetsform').map(String).join(', ') || null,
        contact: [read('contactName'), read('contactPhone'), contactEmail]
          .filter(Boolean)
          .join('\n'),
        senderType: RELATION_TO_SENDER_TYPE[read('relation')] ?? 'DIRECT',
        clientHourlyRate: read('minRate') || null,
        deleted: false,
      },
    }
  }
```

Replace `goNext` with:

```tsx
  const goNext = () => {
    if (!validateStep() || stepIndex >= STEPS.length - 1) {
      return
    }
    const next = STEPS[stepIndex + 1].value
    if (next === 'granska') {
      const current = snapshot()
      if (current) {
        setPreview(current.view)
        // The receipt goes to the contact by default; the sender can
        // change it on the preview step.
        setEmailAddress((previous) => previous || current.contactEmail)
      }
    }
    setStep(next)
  }
```

On the `<form>` element add `ref={formRef}`.

Change the relation `RadioGroup` to be controlled:

```tsx
                <RadioGroup
                  name="relation"
                  required
                  value={relation}
                  onValueChange={setRelation}
                  className="mt-2 gap-3"
                >
```

In the `kontakt` pane, after the `clientName` block (before the `contactName` block), add the broker-only fields:

```tsx
              {isBroker && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="customerOrganizationNumber" className={LABEL_CLASSES}>
                      Uppdragsgivarens organisationsnummer
                    </Label>
                    <div className="relative">
                      <span
                        className="icon-[lucide--hash] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                        aria-hidden="true"
                      />
                      <Input
                        id="customerOrganizationNumber"
                        name="customerOrganizationNumber"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}-?[0-9]{4}"
                        title="Ange ett organisationsnummer, t.ex. 556677-8899"
                        placeholder="t.ex. 556677-8899…"
                        className={`${FIELD_CLASSES} pl-[2.4em]`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="customerFee" className={LABEL_CLASSES}>
                      Er avgift som mellanhand
                    </Label>
                    <div className="relative">
                      <span
                        className="icon-[lucide--percent] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                        aria-hidden="true"
                      />
                      <Input
                        id="customerFee"
                        name="customerFee"
                        type="text"
                        placeholder="t.ex. 10 % eller 50 kr/h…"
                        value={customerFee}
                        onChange={(event) => setCustomerFee(event.target.value)}
                        required={!nonTransparentFee}
                        disabled={nonTransparentFee}
                        className={`${FIELD_CLASSES} pl-[2.4em] disabled:opacity-60`}
                      />
                    </div>
                    <Label
                      htmlFor="nonTransparentFee"
                      className="mt-2 flex cursor-pointer flex-row items-center gap-3 text-[0.95em] font-normal"
                    >
                      <Checkbox
                        id="nonTransparentFee"
                        checked={nonTransparentFee}
                        onCheckedChange={(checked) => {
                          const on = checked === true
                          setNonTransparentFee(on)
                          if (on) {
                            setCustomerFee('')
                          }
                        }}
                        className="border-brand-blue"
                      />
                      <span>Vi är inte transparenta med vår avgift</span>
                    </Label>
                  </div>
                </div>
              )}
```

After the `kontakt` `TabsContent`, add the preview pane:

```tsx
          <TabsContent value="granska">
            <div
              ref={(el) => {
                paneRefs.current.granska = el
              }}
            >
              <p className="mb-4 leading-[1.6]">
                Så här kommer uppdraget att se ut för frilansarna. Vill du
                ändra något? Gå tillbaka till rätt steg ovan.
              </p>
              {preview && (
                <div className="rounded-[1rem] border border-brand-blue/20">
                  <AssignmentPreview assignment={preview} />
                </div>
              )}

              <div className="mt-6 flex flex-col gap-1.5">
                <Label htmlFor="emailAddress" className={LABEL_CLASSES}>
                  Din e-postadress
                </Label>
                <p className="text-[0.95em] text-brand-blue/80">
                  Hit skickar vi kvittensen och länken där du kan komplettera
                  eller ta bort uppdraget. Håll länken hemlig.
                </p>
                <div className="relative">
                  <span
                    className="icon-[lucide--mail-check] pointer-events-none absolute top-1/2 left-[0.75em] size-[1.2em] -translate-y-1/2 text-brand-blue/75"
                    aria-hidden="true"
                  />
                  <Input
                    id="emailAddress"
                    name="emailAddress"
                    type="email"
                    pattern={EMAIL_PATTERN}
                    title={EMAIL_TITLE}
                    autoComplete="email"
                    value={emailAddress}
                    onChange={(event) => setEmailAddress(event.target.value)}
                    required
                    className={`${FIELD_CLASSES} pl-[2.4em]`}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
```

Change the submit button text to:

```tsx
            {isLoading ? 'Publicerar…' : 'Publicera uppdraget'}
```

and the error alert copy to:

```tsx
          Något gick fel när uppdraget skulle publiceras. Försök igen om en
          stund. Fortsätter det strula, hör av dig via kontaktsidan.
```

- [ ] **Step 6: Copy on the pages and FAQ**

`apps/web/pages/tipsa/index.tsx`, the intro paragraph:

```tsx
        Har du eller ditt företag ett konsultbehov? Beskriv uppdraget, så
        publiceras det direkt för tusentals frilansare i Slack. Det är gratis,
        och de som är intresserade hör av sig direkt till dig. Du får en
        kvittens med en länk där du kan komplettera eller ta bort uppdraget.
```

`apps/web/pages/tipsa/tack.tsx`, eyebrow `Uppdrag publicerat`, heading `Tack, uppdraget är publicerat`, and the two paragraphs:

```tsx
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Uppdraget ligger nu i uppdragskanalen i Slack. En kvittens med en
          länk för att komplettera eller ta bort uppdraget är på väg till
          e-postadressen du angav. Frilansare som är intresserade hör av sig
          direkt till kontaktpersonen. Vi står inte emellan.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/75">
          Har du fler uppdrag?{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            Publicera ett till
          </Link>
          .
        </p>
```

Update `apps/web/__tests__/tack-pages.spec.tsx`: the tipsa assertion becomes `toHaveTextContent('Tack, uppdraget är publicerat')`.

`apps/web/components/Faq/tipsa-faq-items.ts`, the "Vad händer med mitt tips?" item, both `answer` and `answerText`:

```
Det publiceras direkt i uppdragskanalen i vår Slack, där det når tusentals frilansare. Du får en kvittens med en länk där du kan komplettera eller ta bort uppdraget. Intresserade hör av sig via den kontaktväg du angett, ofta redan samma dag.
```

- [ ] **Step 7: Tests, lint, typecheck, and look at it**

Run: `bun test apps/web && bun run check:fix && bun run --filter '@frilansaresverige/web' typecheck`
Expected: pass.

Then `bun run dev` with `apps/web/.env.local` holding `UPPDRAG_API_URL=http://localhost:8989` and `UPPDRAG_API_KEY` matching the service's, `bun run dev:uppdrag` running against the compose MySQL, and open http://localhost:3000/tipsa. Walk all four steps as a broker: the org number and fee appear on step 3, the checkbox disables the fee, step 4 shows the preview with the email prefilled, Publicera lands on /tipsa/tack, and the row appears in MySQL.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components apps/web/pages/tipsa apps/web/__tests__/tack-pages.spec.tsx
git commit -m "feat(web): broker fields and a preview step on the gig form

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Alert dialog primitive and the manage hook

**Files:**
- Create: `packages/ui/src/ui/alert-dialog.tsx`, `apps/web/hooks/useAssignment.ts`, `apps/web/hooks/useAssignment.spec.ts`
- Modify: `packages/ui/package.json` (dependency)

**Interfaces:**
- Consumes: `AssignmentView`, `CommentView` (Task 11), `postForm`, `SubmitError` (`hooks/submit-form.ts`).
- Produces:
  - `packages/ui` exports `@frilansaresverige/ui/ui/alert-dialog` with `AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel`.
  - `interface LoadedAssignment extends AssignmentView { id: string }`, `type AssignmentStatus = 'loading' | 'ready' | 'missing' | 'error'`
  - `fetchAssignment(id): Promise<LoadedAssignment | null>`, `fetchComments(id): Promise<CommentView[]>`
  - `useAssignment(id: string | undefined): { assignment; comments; status; reload(); addComment(text): Promise<void>; remove(): Promise<void> }`

- [ ] **Step 1: Add the primitive**

```bash
cd packages/ui && bun add @radix-ui/react-alert-dialog && cd ../..
```

`packages/ui/src/ui/alert-dialog.tsx` (shadcn's alert-dialog with relative imports, no animation utility classes since the theme has no tw-animate):

```tsx
'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type * as React from 'react'

import { cn } from '../lib/utils'

function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>,
) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl bg-card p-6 text-card-foreground shadow-lg sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function AlertDialogAction(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Action>,
) {
  return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />
}

function AlertDialogCancel(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>,
) {
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
```

Run: `bun run --filter '@frilansaresverige/ui' typecheck`
Expected: clean. (The `./ui/*` export map in `packages/ui/package.json` already covers the new file.)

- [ ] **Step 2: Write the failing hook test**

`apps/web/hooks/useAssignment.spec.ts`:

```ts
import { afterEach, describe, expect, it, jest } from 'bun:test'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssignment } from './useAssignment'

const ID = 'ABCDEFGHIJKLMNOP'

const listing = {
  id: ID,
  senderType: 'BROKER',
  customerName: 'Acme AB',
  title: 'Frontendutvecklare',
  description: 'React.',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: null,
  contact: 'Kim',
  clientHourlyRate: '950',
  deleted: false,
}

type Scripted = { status: number; body: unknown }

// Answers by method + url so the order of calls does not matter.
const scriptFetch = (script: Record<string, Scripted>) => {
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    const hit = script[key]
    if (!hit) {
      throw new Error(`unscripted ${key}`)
    }
    return new Response(JSON.stringify(hit.body), { status: hit.status })
  })
  global.fetch = fn as unknown as typeof fetch
  return fn
}

describe('useAssignment', () => {
  afterEach(() => jest.restoreAllMocks())

  it('loads the listing and its comments sorted by id', async () => {
    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: { status: 200, body: listing },
      [`GET /api/uppdrag/assignments/${ID}/comments`]: {
        status: 200,
        body: [
          { id: 2, comment: 'Två', created: 2 },
          { id: 1, comment: 'Ett', created: 1 },
        ],
      },
    })
    const { result } = renderHook(() => useAssignment(ID))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.assignment).toMatchObject({ id: ID, title: 'Frontendutvecklare' })
    expect(result.current.comments.map((c) => c.id)).toEqual([1, 2])
  })

  it('reports a missing listing and an error', async () => {
    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: { status: 404, body: { success: false } },
    })
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('missing'))

    scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: { status: 502, body: { success: false } },
    })
    const { result: failed } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(failed.current.status).toBe('error'))
  })

  it('does not fetch comments for a deleted listing', async () => {
    const fetchMock = scriptFetch({
      [`GET /api/uppdrag/assignments/${ID}`]: {
        status: 200,
        body: { id: ID, title: 'Frontendutvecklare', deleted: true },
      },
    })
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.assignment?.deleted).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('adds a comment and reloads the list', async () => {
    let comments: unknown[] = []
    const fn = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        comments = [{ id: 1, comment: 'Ny', created: 3 }]
        return new Response(JSON.stringify({ success: true }), { status: 201 })
      }
      if (url.endsWith('/comments')) {
        return new Response(JSON.stringify(comments), { status: 200 })
      }
      return new Response(JSON.stringify(listing), { status: 200 })
    })
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => {
      await result.current.addComment('Ny')
    })
    expect(result.current.comments).toEqual([{ id: 1, comment: 'Ny', created: 3 }])
    const post = fn.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(post?.[0]).toBe(`/api/uppdrag/assignments/${ID}/comments`)
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ comment: 'Ny' })
  })

  it('deletes and reloads into the deleted state', async () => {
    let deleted = false
    const fn = jest.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        deleted = true
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      return new Response(
        JSON.stringify(deleted ? { id: ID, title: 't', deleted: true } : listing),
        { status: 200 },
      )
    })
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => {
      await result.current.remove()
    })
    expect(result.current.assignment?.deleted).toBe(true)
  })

  it('surfaces a failed delete', async () => {
    const fn = jest.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'DELETE'
        ? new Response(JSON.stringify({ success: false, error: 'nope' }), { status: 502 })
        : new Response(JSON.stringify(listing), { status: 200 }),
    )
    global.fetch = fn as unknown as typeof fetch
    const { result } = renderHook(() => useAssignment(ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await expect(result.current.remove()).rejects.toThrow('nope')
  })
})
```

- [ ] **Step 3: Run it, expect failure**

Run: `bun test apps/web/hooks/useAssignment.spec.ts`
Expected: FAIL, cannot resolve `./useAssignment`.

- [ ] **Step 4: Implement the hook**

`apps/web/hooks/useAssignment.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { AssignmentView, CommentView } from '../components/AssignmentPreview'
import { postForm, SubmitError } from './submit-form'

export interface LoadedAssignment extends AssignmentView {
  id: string
}

export type AssignmentStatus = 'loading' | 'ready' | 'missing' | 'error'

const readJson = async (response: Response): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const failed = (response: Response, payload: Record<string, unknown>) =>
  new SubmitError(
    typeof payload.error === 'string'
      ? payload.error
      : `Request failed with status ${response.status}`,
    response.status,
  )

/** The public listing, null when unknown, with a deleted one flattened. */
export async function fetchAssignment(id: string): Promise<LoadedAssignment | null> {
  const response = await fetch(`/api/uppdrag/assignments/${id}`)
  if (response.status === 404) {
    return null
  }
  const payload = await readJson(response)
  if (!response.ok) {
    throw failed(response, payload)
  }
  if (payload.deleted === true) {
    return {
      id,
      title: String(payload.title ?? ''),
      description: '',
      customerName: '',
      location: null,
      scope: null,
      workForm: null,
      contact: '',
      senderType: 'DIRECT',
      clientHourlyRate: null,
      deleted: true,
    }
  }
  return { ...(payload as unknown as LoadedAssignment), id, deleted: false }
}

export async function fetchComments(id: string): Promise<CommentView[]> {
  const response = await fetch(`/api/uppdrag/assignments/${id}/comments`)
  const payload = await response.json()
  if (!response.ok || !Array.isArray(payload)) {
    throw new SubmitError(`Request failed with status ${response.status}`, response.status)
  }
  return (payload as CommentView[]).slice().sort((a, b) => a.id - b.id)
}

// State for /tipsa/hantera/[id]: the listing, its comments, and the two
// mutations, each of which reloads so the page shows what the service
// has rather than what it optimistically assumed.
export const useAssignment = (id: string | undefined) => {
  const [assignment, setAssignment] = useState<LoadedAssignment | null>(null)
  const [comments, setComments] = useState<CommentView[]>([])
  const [status, setStatus] = useState<AssignmentStatus>('loading')

  const reload = useCallback(async () => {
    if (!id) {
      return
    }
    setStatus('loading')
    try {
      const loaded = await fetchAssignment(id)
      if (loaded === null) {
        setAssignment(null)
        setStatus('missing')
        return
      }
      setAssignment(loaded)
      setComments(loaded.deleted ? [] : await fetchComments(id))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  const addComment = async (comment: string) => {
    if (!id) {
      return
    }
    await postForm(`/api/uppdrag/assignments/${id}/comments`, { comment })
    setComments(await fetchComments(id))
  }

  const remove = async () => {
    if (!id) {
      return
    }
    const response = await fetch(`/api/uppdrag/assignments/${id}`, { method: 'DELETE' })
    const payload = await readJson(response)
    if (!response.ok || payload.success !== true) {
      throw failed(response, payload)
    }
    await reload()
  }

  return { assignment, comments, status, reload, addComment, remove }
}
```

- [ ] **Step 5: Run tests, lint, typecheck**

Run: `bun test apps/web/hooks && bun run check:fix && bun run typecheck`
Expected: pass in every workspace.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/package.json packages/ui/src/ui/alert-dialog.tsx bun.lock apps/web/hooks/useAssignment.ts apps/web/hooks/useAssignment.spec.ts
git commit -m "feat: alert-dialog primitive and the manage-page hook

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: The manage page

**Files:**
- Create: `apps/web/pages/tipsa/hantera/[id].tsx`, `apps/web/__tests__/hantera-page.spec.tsx`
- Modify: `apps/web/lib/routes.ts` (one entry), `apps/web/lib/routes.spec.ts` (noindex assertion)

**Interfaces:**
- Consumes: `useAssignment`, `AssignmentPreview`, the alert-dialog exports, `Button`, `Alert`, `Textarea`, `Label`, `FIELD_CLASSES`, `LABEL_CLASSES`, `requireRoute`, `Seo`.

- [ ] **Step 1: Register the route**

In `apps/web/lib/routes.ts`, after the `/tipsa/tack` entry add:

```ts
  {
    path: '/tipsa/hantera',
    title: 'Hantera ditt uppdrag',
    description:
      'Komplettera eller ta bort ett uppdrag du har publicerat. Sidan nås bara via länken i din kvittens.',
    parent: '/tipsa',
    noindex: true,
  },
```

In `apps/web/lib/routes.spec.ts`, extend `marks tack pages noindex`:

```ts
    expect(getRoute('/tipsa/hantera')?.noindex).toBe(true)
```

- [ ] **Step 2: Write the failing page test**

`apps/web/__tests__/hantera-page.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

mock.module('next/router', () => ({
  useRouter: () => ({ isReady: true, query: { id: 'ABCDEFGHIJKLMNOP' } }),
}))

const { default: Hantera } = await import('../pages/tipsa/hantera/[id]')

const listing = {
  id: 'ABCDEFGHIJKLMNOP',
  senderType: 'DIRECT',
  customerName: 'Acme AB',
  title: 'Frontendutvecklare',
  description: 'React.',
  location: 'Göteborg',
  scope: 'Heltid',
  workForm: null,
  contact: 'Kim',
  clientHourlyRate: null,
  deleted: false,
}

const answer = (byUrl: (url: string) => { status: number; body: unknown }) => {
  global.fetch = jest.fn(async (url: string) => {
    const { status, body } = byUrl(url)
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof fetch
}

describe('/tipsa/hantera/[id]', () => {
  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  it('shows the listing, the comment form and the delete link', async () => {
    answer((url) =>
      url.endsWith('/comments') ? { status: 200, body: [] } : { status: 200, body: listing },
    )
    render(<Hantera />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frontendutvecklare'),
    )
    expect(screen.getByLabelText(/Komplettera uppdraget/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ta bort uppdraget' })).toBeInTheDocument()
  })

  it('tells the visitor when the listing is gone', async () => {
    answer(() => ({ status: 404, body: { success: false } }))
    render(<Hantera />)
    await waitFor(() =>
      expect(screen.getByText('Det uppdrag du söker kunde inte hittas.')).toBeInTheDocument(),
    )
  })

  it('hides the forms for a deleted listing', async () => {
    answer(() => ({
      status: 200,
      body: { id: listing.id, title: 'Frontendutvecklare', deleted: true },
    }))
    render(<Hantera />)
    await waitFor(() =>
      expect(screen.getByText('Denna uppdragsannons har raderats.')).toBeInTheDocument(),
    )
    expect(screen.queryByLabelText(/Komplettera uppdraget/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ta bort uppdraget' })).toBeNull()
  })
})
```

- [ ] **Step 3: Run it, expect failure**

Run: `bun test apps/web/__tests__/hantera-page.spec.tsx`
Expected: FAIL, cannot resolve the page.

- [ ] **Step 4: Implement the page**

`apps/web/pages/tipsa/hantera/[id].tsx`:

```tsx
import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Alert, AlertDescription } from '@frilansaresverige/ui/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frilansaresverige/ui/ui/alert-dialog'
import { Label } from '@frilansaresverige/ui/ui/label'
import { Textarea } from '@frilansaresverige/ui/ui/textarea'
import { useRouter } from 'next/router'
import { type FormEvent, useState } from 'react'
import AssignmentPreview from '../../../components/AssignmentPreview'
import { FIELD_CLASSES, LABEL_CLASSES } from '../../../components/form-classes'
import Seo from '../../../components/Seo'
import { useAssignment } from '../../../hooks/useAssignment'
import { requireRoute } from '../../../lib/routes'

const ERROR_COPY = 'Något gick fel. Försök igen om en stund.'

// Reached only through the link in the receipt mail. Client-rendered:
// the id is secret, so nothing about it is prerendered or indexed.
const Hantera = () => {
  const meta = requireRoute('/tipsa/hantera')
  const router = useRouter()
  const id = router.isReady && typeof router.query.id === 'string' ? router.query.id : undefined
  const { assignment, comments, status, addComment, remove } = useAssignment(id)
  const [comment, setComment] = useState('')
  const [commentState, setCommentState] = useState<'editing' | 'saving' | 'saved'>('editing')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!comment.trim() || commentState === 'saving') {
      return
    }
    setCommentState('saving')
    setError(null)
    try {
      await addComment(comment.trim())
      setComment('')
      setCommentState('saved')
    } catch {
      setError(ERROR_COPY)
      setCommentState('editing')
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await remove()
      setConfirming(false)
      setCommentState('editing')
    } catch {
      setError(ERROR_COPY)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-[44em] pt-10 pb-24 md:pt-16">
      <Seo title={meta.title} description={meta.description} path={meta.path} noindex />

      <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
        Konsultuppdrag
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
        Hantera ditt uppdrag
      </h1>

      {status === 'loading' && (
        <p className="mt-6 text-brand-cream/75" role="status">
          Hämtar uppdraget…
        </p>
      )}

      {status === 'missing' && (
        <p className="mt-6 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Det uppdrag du söker kunde inte hittas.
        </p>
      )}

      {status === 'error' && (
        <p className="mt-6 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          {ERROR_COPY}
        </p>
      )}

      {status === 'ready' && assignment && (
        <>
          <p className="mt-4 mb-8 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
            {assignment.deleted
              ? 'Uppdraget är borttaget och visas inte längre för andra.'
              : 'Du som har länken hit kan komplettera uppdraget eller ta bort det. Håll därför länken hemlig.'}
          </p>

          {error && (
            <Alert
              role="alert"
              className="mb-6 rounded-[0.75em] border-[#6a6a6a] bg-[#ffaaaa] p-5 text-brand-grey"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AssignmentPreview assignment={assignment} comments={comments} />

          {!assignment.deleted && (
            <>
              <form
                className="mt-8 rounded-[1.25rem] bg-brand-cream p-6 text-brand-blue md:p-8"
                onSubmit={submitComment}
                aria-busy={commentState === 'saving'}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comment" className={LABEL_CLASSES}>
                    Komplettera uppdraget med ny information
                  </Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={commentState === 'saving'}
                    required
                    className={`${FIELD_CLASSES} min-h-[8em]`}
                  />
                </div>
                {commentState === 'saved' && (
                  <p className="mt-3 text-[0.95em]" role="status">
                    <strong>Tack!</strong> Kompletteringen är sparad och skickad till Slack.
                  </p>
                )}
                <div className="mt-5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="none"
                    disabled={!comment.trim() || commentState === 'saving'}
                  >
                    {commentState === 'saving' ? 'Sparar…' : 'Spara komplettering'}
                  </Button>
                </div>
              </form>

              <div className="mt-8">
                <Button
                  type="button"
                  variant="primary-outline"
                  size="none"
                  onClick={() => setConfirming(true)}
                >
                  Ta bort uppdraget
                </Button>
              </div>

              <AlertDialog open={confirming} onOpenChange={(open) => !deleting && setConfirming(open)}>
                <AlertDialogContent className="bg-brand-cream text-brand-blue">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-xl font-extrabold">
                      Ta bort uppdraget?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-brand-blue/80">
                      Uppdraget slutar visas och meddelandena i Slack skrivs över. Det går inte att ångra.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button type="button" variant="primary-outline" size="none" disabled={deleting}>
                        Avbryt
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        type="button"
                        variant="primary"
                        size="none"
                        disabled={deleting}
                        onClick={(event) => {
                          // Keep the dialog open until the request settles.
                          event.preventDefault()
                          void confirmDelete()
                        }}
                      >
                        {deleting ? 'Tar bort…' : 'Ta bort'}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Hantera
```

- [ ] **Step 5: Run tests, lint, typecheck, build**

Run: `bun test apps/web && bun run check:fix && bun run typecheck && bun run build`
Expected: pass, and `next build` lists `/tipsa/hantera/[id]` as a static page.

If `mock.module('next/router')` leaks into other page specs run in the same process, move the mock into a `beforeAll` that restores with `mock.restore()` in `afterAll`.

- [ ] **Step 6: Try it**

With both dev servers running, publish a listing on /tipsa, open the manage link from the receipt (or build it from the id in MySQL), add a komplettering, then delete. Expect: the comment appears under the listing, the delete dialog closes into the deleted state, and Slack messages are rewritten.

- [ ] **Step 7: Commit**

```bash
git add apps/web/pages/tipsa/hantera apps/web/__tests__/hantera-page.spec.tsx apps/web/lib/routes.ts apps/web/lib/routes.spec.ts
git commit -m "feat(web): manage page for published gigs with comments and deletion

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Service image, deploy script and docs

**Files:**
- Create: `apps/uppdrag/Dockerfile`, `apps/uppdrag/README.md`
- Modify: `deploy.sh`, `README.md` (root: layout, getting started, deployment), `.github/workflows/ci.yml` (no change needed; verify)

- [ ] **Step 1: The service image**

`apps/uppdrag/Dockerfile` (built from the repo root: `docker build -f apps/uppdrag/Dockerfile .`):

```dockerfile
# syntax=docker/dockerfile:1

# Built from the repo root so the workspace install resolves bun.lock.
FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# Every workspace manifest must exist for a frozen install, even the ones
# filtered out below.
COPY apps/web/package.json apps/web/
COPY apps/story/package.json apps/story/
COPY apps/uppdrag/package.json apps/uppdrag/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/
RUN bun install --frozen-lockfile --production --filter '@frilansaresverige/uppdrag'

FROM oven/bun:1.4.2-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8989
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/uppdrag/node_modules ./apps/uppdrag/node_modules
COPY apps/uppdrag ./apps/uppdrag
# The image ships a `bun` user; nothing here needs root.
USER bun
EXPOSE 8989
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8989/api/health || exit 1
CMD ["bun", "apps/uppdrag/src/index.ts"]
```

If `apps/uppdrag/node_modules` does not exist in the deps stage (the hoisted linker put everything at the root), drop that `COPY` line.

Build it:

```bash
docker build --platform linux/amd64 -f apps/uppdrag/Dockerfile -t frilansaresverige-uppdrag .
docker run --rm -e MYSQL_URL=mysql://x -e SMTP_HOST=x -e SMTP_USER=x -e SMTP_PASS=x -e EMAIL_FROM=x -e SLACK_BOT_TOKEN=x -e SLACK_CHANNEL_BROKER=x -e SLACK_CHANNEL_DIRECT=x -e SITE_URL=http://x -e UPPDRAG_API_KEY=x -p 8989:8989 frilansaresverige-uppdrag &
sleep 3; curl -i http://localhost:8989/assignments/ABC   # 301 to http://x/tipsa/hantera/ABC
docker stop $(docker ps -q --filter ancestor=frilansaresverige-uppdrag)
```

Also confirm the web image still builds: `docker build --platform linux/amd64 -t frilansaresverige-website .` (needs `apps/web/.env.local` for the build args to be meaningful, but must complete either way).

- [ ] **Step 2: Ship both images**

In `deploy.sh`, replace the `docker build` line through the end of the file with:

```bash
docker build --platform linux/amd64 -t frilansaresverige-website \
  --build-arg GOOGLE_ANALYTICS_ID="${GOOGLE_ANALYTICS_ID:-}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://frilansaresverige.se}" \
  .
# The uppdrag service reads all of its configuration at runtime, so no
# build args; its env lives in the compose file on the server.
docker build --platform linux/amd64 -t frilansaresverige-uppdrag \
  -f apps/uppdrag/Dockerfile .
docker save frilansaresverige-website:latest frilansaresverige-uppdrag:latest | gzip | ssh gredelin 'gunzip | docker load'
ssh gredelin 'cd /home/martin/frilansaresverige && docker compose up -d'
```

- [ ] **Step 3: Service README**

`apps/uppdrag/README.md`:

```markdown
# @frilansaresverige/uppdrag

The service behind publishing gigs on frilansaresverige.se/tipsa and
uppdrag.frilansaresverige.se. A single Bun process: `Bun.serve` routes,
`Bun.SQL` against MySQL, `fetch` against the Slack Web API, nodemailer for
the receipt mail.

What it does: stores a published gig, posts it to the broker or direct
Slack channel (a message plus a thread reply with the description), emails
the sender a secret manage link, posts later "kompletteringar" as broadcast
replies, and on deletion rewrites every Slack message. Anything that never
reached Slack is retried on startup. It also serves the Slack member count
the homepage shows.

## Endpoints

| Route | Auth | Notes |
|---|---|---|
| `POST /api/assignments` | bearer key | `201 { success, id }`; the body is validated in `src/validate.ts` |
| `GET /api/assignments/:id` | bearer key | public fields, or `{ id, title, deleted: true }` |
| `DELETE /api/assignments/:id` | bearer key | soft delete |
| `GET`/`POST /api/assignments/:id/comments` | bearer key | list, add |
| `GET /api/health` | open | 200 when MySQL answers |
| `GET /api/member-count` | open | `text/plain`, 503 until the first refresh |
| `GET /assignments/:id`, `GET /` | open | 301 to the site (old receipt links) |

The key is `UPPDRAG_API_KEY`; apps/web sends it and is the only caller.
The site's honeypot and rate limit live in its proxy
(`apps/web/lib/uppdrag-proxy.server.ts`).

## Running it locally

```bash
docker compose -f apps/uppdrag/compose.yml up -d   # MySQL 8 with schema.sql applied
cp apps/uppdrag/.env.example apps/uppdrag/.env      # fill it in
bun run dev:uppdrag                                 # http://localhost:8989
```

Point the site at it with `UPPDRAG_API_URL=http://localhost:8989` and the
same `UPPDRAG_API_KEY` in `apps/web/.env.local`.

Tests: `bun test apps/uppdrag`. The database spec runs only when
`MYSQL_URL` is set:

```bash
MYSQL_URL=mysql://uppdrag:uppdrag@127.0.0.1:3306/uppdrag bun test apps/uppdrag/src/db.spec.ts
```

## Deploying

`deploy.sh` at the repo root builds `frilansaresverige-uppdrag` from
`apps/uppdrag/Dockerfile` (context: repo root) alongside the web image and
ships both. On the server the compose file needs, once:

```yaml
services:
  uppdrag:
    image: frilansaresverige-uppdrag:latest
    restart: unless-stopped
    env_file: uppdrag.env          # the variables in .env.example
  web:
    environment:
      UPPDRAG_API_URL: http://uppdrag:8989
      UPPDRAG_API_KEY: ${UPPDRAG_API_KEY}
```

and the reverse proxy keeps routing uppdrag.frilansaresverige.se to the
`uppdrag` service on 8989. Before the first deploy, apply the last `ALTER
TABLE` block of `schema.sql` to the production database by hand; the
earlier statements are already in place.
```

- [ ] **Step 4: Root README**

In the root `README.md`:

- In "Monorepo layout", after the `story/` line add:
  ```
    uppdrag/      Bun service behind /tipsa: MySQL, Slack, receipt mails (see apps/uppdrag/README.md)
  ```
- In "Getting started", after the `.env.example` sentence add: "The gig form on `/tipsa` needs the uppdrag service running too; `apps/uppdrag/README.md` covers it in three commands."
- In "Deployment", append: "`deploy.sh` also builds and ships the uppdrag service image; see `apps/uppdrag/README.md` for the compose fragment the server needs."
- Update the "What this is" sentence "there is no database" to "the membership form posts to Slack via a webhook; published gigs go through the uppdrag service and its MySQL."

- [ ] **Step 5: CI**

Confirm `.github/workflows/ci.yml` needs nothing: `bun run check`, `bun run typecheck` (every workspace via the root filter) and root `bun test` already cover `apps/uppdrag`. Run the same locally:

```bash
bun run check && bun run typecheck && bun test && bun run build
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/uppdrag/Dockerfile apps/uppdrag/README.md deploy.sh README.md
git commit -m "build: ship the uppdrag service image alongside the site

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Cutover checklist (manual, after Task 14)

Do these in order:

1. Build `apps/uppdrag/Dockerfile` locally and start it once against a
   scratch env before anything touches the server:
   `docker build -t frilansaresverige-uppdrag -f apps/uppdrag/Dockerfile .`,
   then `docker run --rm -p 8989:8989 --env-file <scratch env> frilansaresverige-uppdrag`
   and `curl http://localhost:8989/api/health`.
2. Confirm the production MySQL accepts `?sslmode=require` in `MYSQL_URL`,
   or configure a user with `mysql_native_password` instead of the
   `caching_sha2_password` default. Then apply the last `ALTER TABLE` block
   at the end of `apps/uppdrag/schema.sql` by hand; the earlier statements
   are already in place.
3. Inspect the rows the startup sync would post:
   `SELECT id, created, deleted FROM assignment WHERE slackId IS NULL`.
   Delete or mark any stale ones. The service skips deleted rows, but old
   undeleted failures will be posted.
4. On the server: write `uppdrag.env` from `apps/uppdrag/.env.example` with
   the production values, add the compose service and the two web env vars
   (see the `apps/uppdrag/README.md` compose snippet), point the reverse proxy for uppdrag.frilansaresverige.se at the
   `uppdrag` service on 8989, and confirm the proxy overwrites
   `X-Forwarded-For` rather than appending to it (the rate limiter trusts
   the first hop).
5. Stop and remove the old bot container, so two processes never share the
   database or both run the startup sync.
6. Run `./deploy.sh` from the repo root (it loads both images before
   `docker compose up`).
7. Parity check against production: publish as broker and as direct on
   /tipsa; the message and thread land in the right channel; the receipt
   arrives; the manage link works; add a komplettering; delete; every Slack
   message is rewritten to "raderats"; one old receipt link on the old
   domain redirects (take the real link format from an old mail); a legacy
   row with only `contact` set renders on the manage page; the homepage
   member count renders.
