# Migration: the uppdrag bot onto Bun, with its UI folded into apps/web

Date: 2026-09-22
Status: Approved for planning

## Goal

Bring the source of uppdrag.frilansaresverige.se (dropped into `apps/bot`
from its own repo) in line with the monorepo: a Bun-native TypeScript service
using `Bun.serve`, `Bun.SQL` and `fetch`, tested with `bun test`, linted by
Biome. Its Vue frontend is not ported; the publish, manage, comment and delete
flows become pages in `apps/web`, built on the site's existing React, Tailwind
and shadcn conventions. `/tipsa` stops posting to a Slack webhook and becomes
the front of the stateful service.

## Current state

`apps/bot` is two npm packages with no shared tooling:

| Area | Today |
|---|---|
| Backend | Node 24, Express 4, `mysql2`, `axios`, `nodemailer`, CommonJS, no types, no tests |
| Config | `config.js` (gitignored) holding secrets, channel names and the Swedish message templates |
| Database | MySQL, two tables (`assignment`, `assignmentComment`), `structure.sql` applied by hand |
| Frontend | Vue 3 with Vue CLI, `vue-router`, `axios`, `date-fns`, ESLint + Prettier, hand-written CSS |
| Endpoints | `POST/GET/DELETE /api/assignments[/:id]`, `GET/POST /api/assignments/:id/comments`, `GET /api/health`, `GET /api/member-count` |
| Deploy | Own Dockerfile (`node:24-alpine`), served at uppdrag.frilansaresverige.se |

What the service does: a company publishes a consultancy gig; it is stored,
posted to the broker or direct Slack channel as a message plus a thread reply,
and the sender gets an email with a secret link. Through that link they can add
"kompletteringar" (posted as broadcast thread replies) or delete the listing,
which rewrites every Slack message to "Denna uppdragsannons har raderats." A
startup sync re-posts anything that never reached Slack. `/api/member-count`
caches a Slack channel's member count hourly; the homepage in `apps/web`
already fetches it.

`apps/web` already has `/tipsa`, a three-step gig-tip form that posts straight
to a Slack incoming webhook via `pages/api/submit-gig-tip.ts`. It has no
database, no receipt, no edit link, no comments and no deletion. The bot is the
stateful version of the same flow.

## Decisions

Settled during brainstorming; inputs to the plan, not open questions.

1. **Backend only.** `apps/bot` becomes a Bun API service. Its Vue UI is
   deleted and the flows move into `apps/web`. One public site for users.
2. **MySQL stays**, accessed through Bun's built-in `Bun.SQL` with the
   `mysql` adapter. Same schema, same production data, no data migration.
3. **The form collects the union of both field sets.** `/tipsa` keeps its
   structured fields (scope, work form, split contact) and gains the bot's
   broker-only fields (org number, fee, non-transparent checkbox), a preview
   step and a sender email. The schema gains nullable columns for the fields
   the bot did not have.
4. **Bun-native, proxied via apps/web.** `Bun.serve` routes, no Hono or
   Elysia. The browser never calls the service; thin API routes in `apps/web`
   forward to it over the Docker network, keeping one public origin and the
   existing rate limiter.
5. **The assignment endpoints require a shared API key** that only `apps/web`
   holds, so the proxy's rate limit and honeypot cannot be bypassed by calling
   the service directly. Health and member-count stay open.
6. **Rename** `apps/bot` to `apps/uppdrag` (`@frilansaresverige/uppdrag`),
   after the domain it serves.
7. **Two Docker images.** The web image is unchanged in kind; the service
   gets its own `oven/bun` image. The server's compose file is outside this
   repo and is documented, not edited.
8. **Message templates move from config into code.** They are content, not
   secrets. Env carries only secrets and deployment values.
9. **Nodemailer stays.** Bun has no SMTP client.

## Verified facts

Checked on 2026-09-22 against the installed toolchain:

- Bun `1.4.2` locally, in `.bun-version` and in the production image.
- `Bun.SQL` in `bun-types` for 1.4.2 accepts `adapter: "postgres" | "mysql" |
  "mariadb"` on the same tagged-template API used for Postgres, plus a
  separate `sqlite` adapter. Connection options include `connectionTimeout`
  and `idleTimeout`.
- `Bun.serve` accepts a `routes` table with `:param` segments; the request
  is a `BunRequest` whose `params` is `Record<string, string>`.
- `routes.ts` in `apps/web` already supports `noindex: true`, which removes a
  route from `sitemap.xml` (see `lib/sitemap.ts`). `/tipsa/tack` uses it.
- `packages/ui` exposes `Button` and `Checkbox` from animate-ui and
  `RadioGroup`, `Input`, `Textarea`, `Label`, `Alert`, `Card` from `ui/`. It
  has no alert-dialog.
- `GigTipForm.tsx` (496 lines) is a three-step animate-ui Tabs stepper whose
  hook reads named controls off the form element and posts JSON with the
  honeypot field.
- The root `bun test` preload registers happy-dom for every workspace. The
  service tests need no DOM, which is harmless.

## Target structure

```
apps/
  uppdrag/                          # @frilansaresverige/uppdrag  (was apps/bot)
    package.json                    # dev, start, test, typecheck
    tsconfig.json                   # extends @frilansaresverige/tsconfig/bun-service.json
    Dockerfile                      # oven/bun:1.4.2-alpine, non-root, HEALTHCHECK
    compose.yml                     # local MySQL 8 with schema.sql applied on first boot
    schema.sql                      # structure.sql + migration block for the new columns
    .env.example
    README.md                       # what it is, env, local run, compose fragment for the server
    src/
      index.ts                      # Bun.serve({ routes }), startup sync, member-count timer
      config.ts                     # typed config from env; throws on anything missing
      db.ts                         # Bun.SQL client + the model functions
      slack.ts                      # chat.postMessage, chat.update, conversations.info via fetch
      email.ts                      # nodemailer transport, confirmation mail
      templates.ts                  # Swedish templates + fillTemplate
      validate.ts                   # request body rules and reader
      assignments.ts                # handler functions with injected deps
      *.spec.ts                     # next to the module they test
  web/
    pages/tipsa/index.tsx           # copy changes
    pages/tipsa/tack.tsx            # copy changes
    pages/tipsa/hantera/[id].tsx    # NEW manage page (noindex)
    pages/api/uppdrag/assignments.ts                  # NEW  POST
    pages/api/uppdrag/assignments/[id].ts             # NEW  GET, DELETE
    pages/api/uppdrag/assignments/[id]/comments.ts    # NEW  GET, POST
    pages/api/submit-gig-tip.ts     # DELETED
    lib/uppdrag-proxy.server.ts     # NEW shared forwarding helper
    hooks/useSubmitGigTipForm.ts    # posts to /api/uppdrag/assignments
    hooks/useAssignment.ts          # NEW load, comment, delete
    components/GigTipForm.tsx       # broker fields + preview step
    components/AssignmentPreview.tsx  # NEW, shared by preview step and manage page
packages/
  tsconfig/bun-service.json         # NEW: base without DOM lib or JSX, types ["bun"]
  ui/src/ui/alert-dialog.tsx        # NEW via shadcn add
```

## Design

### The service

**Runtime.** One `Bun.serve` call in `src/index.ts` with a `routes` table:

| Route | Auth | Handler |
|---|---|---|
| `POST /api/assignments` | key | create, then fire-and-forget Slack post and email |
| `GET /api/assignments/:id` | key | public fields, or `{ id, title, deleted: true }` when withdrawn |
| `DELETE /api/assignments/:id` | key | soft delete, then fire-and-forget Slack rewrite |
| `GET /api/assignments/:id/comments` | key | list, `[]` when withdrawn |
| `POST /api/assignments/:id/comments` | key | create, then fire-and-forget Slack reply |
| `GET /api/health` | open | 200 when one `SELECT` succeeds, else 500 |
| `GET /api/member-count` | open | cached count as `text/plain`, 503 until first refresh |
| `GET /assignments/:id` | open | 301 to `${SITE_URL}/tipsa/hantera/:id` |
| `GET /` | open | 301 to `${SITE_URL}/tipsa` |

"key" means `Authorization: Bearer ${UPPDRAG_API_KEY}`; a missing or wrong
key answers 401. A `fetch`-level `error` handler logs and answers 500 without
a body, matching the Express fallback.

Handlers in `assignments.ts` are plain functions `(req, deps) => Response`
where `deps` is `{ db, slack, email, now, log }`. `index.ts` wires the real
implementations; tests pass fakes. This is the same injection shape as
`createSlackFormHandler` in `apps/web`.

**Config** (`config.ts`) reads `process.env` once at startup and throws with
the variable name if a required one is missing:

| Variable | Purpose |
|---|---|
| `PORT`, `HOST` | listen address; default `8989`, `0.0.0.0` |
| `MYSQL_URL` | `mysql://user:pass@host:3306/db` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | nodemailer transport |
| `EMAIL_FROM`, `EMAIL_BCC` | mail headers; BCC optional |
| `EMAIL_TO_OVERRIDE` | optional; when set every mail goes here (dev) |
| `SLACK_BOT_TOKEN` | bot token for the Web API |
| `SLACK_CHANNEL_BROKER`, `SLACK_CHANNEL_DIRECT` | channel names posted to |
| `SLACK_MEMBER_COUNT_CHANNEL` | channel id counted; default `C8P11NBEF` |
| `SITE_URL` | base for the edit link in the email and the redirects |
| `UPPDRAG_API_KEY` | shared secret with `apps/web` |
| `BLOCKED_SENDER_DOMAINS` | comma-separated; default `gmail.com,partna.se` |

**Database** (`db.ts`). `new SQL({ url: MYSQL_URL, adapter: 'mysql' })`. The
model functions keep their names and queries from `model.js`, rewritten as
tagged templates. `getDatabaseHealth`, the guarded `deleteAssignment`, the
`COUNT(*) + 1` comment id and the three "needs propagation" queries carry
over unchanged.

**Schema.** `schema.sql` is `structure.sql` plus one block:

```sql
ALTER TABLE `assignment`
  MODIFY `contact` text COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `scope` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `workForm` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactPhone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `contactEmail` varchar(254) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
```

New rows set the five structured columns and leave `contact` null. Old rows
have `contact` and nulls. Everywhere contact is rendered (Slack template, API
response, preview) a single `contactText(assignment)` helper returns the
structured fields joined as lines when `contactName` is set, else `contact`.
The block is applied to production by hand before the cutover, like
`structure.sql` was.

**Field mapping.** The form's `relation` values `formedlare` / `direktavtal`
map to the stored `senderType` `BROKER` / `DIRECT`. `minRate` maps to
`clientHourlyRate`, `clientName` to `customerName`, `omfattning` to `scope`,
`arbetsform` to `workForm`. The service API speaks the stored names; the
proxy in `apps/web` passes bodies through untouched, so the form hook does
the renaming.

**Validation** (`validate.ts`). A `readFields(body, rules)` with the same rule
shape as `apps/web/lib/slack-form.server.ts` (`label`, `required`, `max`,
`pattern`, `oneOf`), plus `number` for the hourly rate. Rules for create:

| Field | Rule |
|---|---|
| `senderType` | required, oneOf `BROKER`, `DIRECT` |
| `emailAddress` | required, max 254, email pattern; the 400 body is `INVALID_EMAIL_ADDRESS` as today |
| `title`, `location`, `customerName` | required, max 200 |
| `description` | required, max 5000 |
| `scope` | required, max 40 |
| `workForm` | optional, max 100 |
| `contactName` | required, max 200 |
| `contactPhone` | required, max 40 |
| `contactEmail` | required, max 254, email pattern |
| `clientHourlyRate` | optional, integer 0..99999 |
| `customerOrganizationNumber` | optional, max 15 |
| `customerFee` | optional, max 50 |

A sender email whose domain is in `BLOCKED_SENDER_DOMAINS` still answers 201
and stores nothing, as today. Comment bodies: `comment` required, max 5000.

**Slack** (`slack.ts`). `fetch` with `Authorization: Bearer` and JSON bodies
against `chat.postMessage`, `chat.update`, `conversations.info`. The
functions `sync`, `propagateAssignment`, `propagateAssignmentComments`,
`propagateAssignmentDeletion`, `refreshMemberCount` keep their logic exactly:
skip what already reached Slack, store `ts` and channel id after the initial
post, `reply_broadcast` for comments, the terminal-error list for updates,
the "deleted while in flight" check. `fetch` is injected for tests.

**Templates** (`templates.ts`). The five Swedish templates from
`config.js.example` and `fillTemplate` with its conditional line removal for
fee, rate and company URL. `[[CONTACT]]` uses `contactText`. `[[URL]]` is
`${SITE_URL}/tipsa/hantera/${id}`. The allabolag company URL helper carries
over.

**Email** (`email.ts`). One transport created at startup from config. The
confirmation mail keeps its subject and template. Failures are logged, never
surfaced to the client, as today.

**Startup.** `index.ts` runs `slack.sync()` and starts the hourly member-count
refresh after the server is listening, both with logged-not-thrown errors.

### apps/web

**Proxy** (`lib/uppdrag-proxy.server.ts`). `createUppdragProxy({ method,
path, write })` returns a Pages Router handler that checks the method, on
writes checks `application/json`, the honeypot and `checkRateLimit`, then
forwards to `${UPPDRAG_API_URL}${path}` with `Authorization: Bearer
${UPPDRAG_API_KEY}`, `X-Forwarded-For` set to `clientKey(req)`, and the JSON
body. The upstream status and body are passed through. A missing
`UPPDRAG_API_URL` or key answers 500 with the same "not configured" message
the invitation form uses. Upstream unreachable answers 502. `fetch`, `env`
and `now` are injectable.

The three API files instantiate it for the five endpoints; `[id]` comes from
`req.query`.

**Form** (`GigTipForm.tsx`). Two changes to the stepper:

- When `relation` is `formedlare`, the client step also shows
  `customerOrganizationNumber`, `customerFee`, and a Checkbox
  `isNonTransparentFee` that clears and disables the fee input. Fee is
  required for brokers unless the checkbox is set.
- A fourth step, "Förhandsgranska": renders `AssignmentPreview` from the
  current form values, an `emailAddress` input prefilled from `contactEmail`
  (the receipt and edit link go here), and the submit button labelled
  "Publicera". Going back keeps the values, as the stepper already does.

The hook posts the mapped body to `/api/uppdrag/assignments`. `arbetsform`
stays a joined string. On success the page routes to `/tipsa/tack` as today.

**Copy.** `/tipsa` intro and step labels drop "tre korta steg". `/tipsa/tack`
says a receipt with a link to manage the listing has been sent to the
address given, and that the listing is already in Slack. The FAQ item that
describes manual review, if any, is corrected. Swedish copy follows the
existing style memory: no dash asides, du-tilltal.

**Manage page** (`pages/tipsa/hantera/[id].tsx`). Client-rendered from
`useAssignment(id)`, which loads the assignment and its comments sorted by
id. States: loading, not found ("Den publikation du söker kunde inte
hittas."), deleted (the notice, the preview in its deleted state, nothing
else), active (preview with comments, the comment form, and a "Radera
publikationen" link that opens a shadcn AlertDialog with the existing
confirm copy; confirming calls DELETE and reloads). Comment submit shows the
"Tack! Din komplettering har sparats." line with a "Skriv en till" link.
Errors surface through the existing `Alert` component, not `alert()`.
Registered in `routes.ts` with `parent: '/tipsa'` and `noindex: true`.

**AssignmentPreview.** Title, description, client, contact (structured or
fallback), sender type in words, comments with the Swedish timestamp format
the Vue component used (`Intl.DateTimeFormat('sv-SE', ...)` rather than
date-fns, which `apps/web` does not depend on). Renders the deleted state.

**Removed.** `pages/api/submit-gig-tip.ts`, its spec, and
`SLACK_GIG_TIP_WEBHOOK_URL` from `.env.example` and the README.

**Member count.** `pages/index.tsx` builds the URL from `UPPDRAG_API_URL`
(falling back to the public domain so a checkout without env still works),
keeping the timeout and "flera tusen" fallback.

**packages/ui.** `shadcn add alert-dialog` into `packages/ui/src/ui`, with
the `@/` import rewrite the README describes. Nothing else changes; the
boundary test from the earlier spec still holds.

### Shared config

`packages/tsconfig/bun-service.json`: extends `base.json`, drops the DOM
libs and JSX, sets `types: ["bun"]`. `packages/tsconfig/package.json` lists
it in `files`.

`biome.json` needs no new override; the service is plain TypeScript. The
root `package.json` gains `dev:uppdrag` and `test` continues to sweep every
workspace from the root.

### Docker, deploy and local development

**Root Dockerfile** (web): copy `apps/uppdrag/package.json` alongside the
other manifests so the frozen install resolves the lockfile, and extend the
install filter to `--filter '!@frilansaresverige/story' --filter
'!@frilansaresverige/uppdrag'`. Nothing else changes.

**`apps/uppdrag/Dockerfile`**: `oven/bun:1.4.2-alpine`, copy the root
manifests plus every workspace manifest, `bun install --frozen-lockfile
--production --filter '@frilansaresverige/uppdrag'`, copy `apps/uppdrag`,
run as a non-root user, `EXPOSE 8989`, `HEALTHCHECK` curling `/api/health`,
`CMD ["bun", "apps/uppdrag/src/index.ts"]`. Built from the repo root with
`-f apps/uppdrag/Dockerfile` so workspace resolution works.

**`deploy.sh`** builds both images for `linux/amd64`, streams both over SSH,
and runs `docker compose up -d` once. The service reads no build args; all
its configuration is runtime env.

**Server compose fragment** (documented in `apps/uppdrag/README.md`, applied
by hand on the server):

```yaml
uppdrag:
  image: frilansaresverige-uppdrag:latest
  restart: unless-stopped
  env_file: uppdrag.env
web:
  environment:
    UPPDRAG_API_URL: http://uppdrag:8989
    UPPDRAG_API_KEY: ${UPPDRAG_API_KEY}
```

The reverse proxy keeps routing uppdrag.frilansaresverige.se to the service
so the redirects and member-count keep working at their old URLs.

**Local development.** `bun run dev` starts only the site, as today.
`bun run dev:uppdrag` runs `bun --watch src/index.ts` in the workspace.
`apps/uppdrag/compose.yml` runs MySQL 8 with `schema.sql` mounted into
`/docker-entrypoint-initdb.d/`. `apps/uppdrag/.env.example` documents every
variable with the same "WITHOUT IT" notes the root example uses. The root
`.env.example` gains `UPPDRAG_API_URL` and `UPPDRAG_API_KEY` for the web app;
without them `/tipsa` fails loudly with the "not configured" error.

**Devcontainer.** A named volume for `apps/uppdrag/node_modules` and port
8989 forwarded.

**CI.** No new steps. Biome, `bun run typecheck` (every workspace) and root
`bun test` cover the service. The database integration spec self-skips
without `MYSQL_URL`.

### Testing

Service, in `bun test`, all without network or database:

- `validate.spec.ts`: each rule, the email pattern, the blocked-domain
  short-circuit, the number rule.
- `templates.spec.ts`: every template against a broker and a direct
  assignment, with and without fee, rate and org number; `contactText` for
  structured and legacy rows.
- `slack.spec.ts`: scripted `fetch` responses for the initial post, thread,
  comment, deletion with a terminal error, deletion with a retryable error,
  member-count refresh failure.
- `assignments.spec.ts`: each handler with fake `db`, `slack`, `email`: auth
  rejection, validation 400s, 404s, the deleted-assignment responses, the
  guarded delete, fire-and-forget calls made.
- `db.spec.ts`: round-trips against a real MySQL, `describe.skipIf(!process
  .env.MYSQL_URL)`.

apps/web, in `bun test`:

- `uppdrag-proxy.server.spec.ts`: method and content-type rejection,
  honeypot 200, rate limit 429, missing config 500, upstream 502, status and
  body pass-through with the bearer header set.
- `useSubmitGigTipForm.spec.ts` extended for the mapping and new fields;
  `useAssignment.spec.ts` for load, comment, delete.
- `routes.spec.ts` already asserts every registered route resolves; the new
  route joins it.

Parity check before cutover, against the local MySQL and a test Slack
workspace: publish as broker and as direct; confirm the message lands in the
right channel with the thread; add a comment; receive the confirmation mail
with a working link; delete and confirm every Slack message is rewritten;
load one row inserted with only `contact` set and confirm it renders.

## Phased execution

Each phase leaves `bun run check`, `bun run typecheck`, `bun test` and
`bun run build` green.

1. **Service skeleton.** Rename, delete the Vue frontend and npm files, add
   the tsconfig preset, `package.json`, `config.ts`, `Bun.serve` with health
   only, `schema.sql`, `compose.yml`, `.env.example`. Root manifests and
   Dockerfile updated so the workspace installs.
2. **Port the backend.** `db.ts`, `templates.ts`, `slack.ts`, `email.ts`,
   `validate.ts`, `assignments.ts`, tests, then the routes and startup
   tasks. Service complete and runnable against the local MySQL.
3. **Proxy and form.** `uppdrag-proxy.server.ts` and the three API files,
   the hook mapping, broker fields and preview step, copy changes, removal
   of the webhook route. `/tipsa` publishes end to end.
4. **Manage page.** `alert-dialog` in `packages/ui`, `AssignmentPreview`,
   `useAssignment`, the page and its route.
5. **Deploy.** Service Dockerfile, `deploy.sh`, READMEs, devcontainer. Apply
   the schema block to production, add the compose service and env on the
   server, ship both images, run the parity check.

## Out of scope

- Any change to the gig listings under `/uppdrag`, which are MDX content and
  unrelated to this service.
- The membership form and its Slack-invitation route.
- Moving templates or channel choice to a database or admin UI.
- Turnstile or any bot protection beyond the honeypot and rate limit.
- Running MySQL in GitHub Actions.
- A Storybook story for the manage page (the form already has none).

## Accepted risks

- **Cutover has a manual step on the server**: the schema block, the compose
  service and the env file. Mitigated by the README fragment and by doing
  the server steps before the release that switches `/tipsa`. The webhook
  route is removed in phase 3 as designed; there is no staged fallback.
- **`Bun.SQL` MySQL adapter is newer than `mysql2`.** The queries are simple
  parameterised statements; the integration spec exercises every one. If a
  blocking bug appears the adapter is one file to swap.
- **Old `contact` rows** render through the fallback path only; nothing
  backfills them. Acceptable: listings are short-lived.
- **The blocked-domain short-circuit** silently drops gmail senders, a
  behaviour inherited unchanged. Flagged, not fixed, so the product decision
  stays with the community.
