# Nyheter + Event Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apple Newsroom-style MDX blog at `/nyheter` and events section at `/event` (archives + single pages), statically generated and wired into routes.ts, sitemap, breadcrumbs and SEO.

**Architecture:** MDX files with YAML frontmatter in `apps/web/content/{nyheter,event}/`, loaded by a small fs+gray-matter library (`lib/content.ts`) from `getStaticProps`/`getStaticPaths`; bodies serialized with `next-mdx-remote/serialize` and rendered through a brand-styled component map. Covers are deterministic brand gradients (no binary assets).

**Tech Stack:** Next.js 16 Pages Router, React 19, Tailwind 4 (brand tokens: `brand-blue #4823dc`, `brand-cream #fffce3`, `brand-coral #ff9c8e`, `brand-coral-light #ffcfc8`, `brand-blue-dark #2601bb`), `next-mdx-remote@6`, `gray-matter@4`, bun test + happy-dom + testing-library.

**Spec:** `docs/superpowers/specs/2026-08-29-nyheter-event-design.md`

## Global Constraints

- All copy in Swedish; dates via `Intl.DateTimeFormat('sv-SE')`, no date library.
- Frontmatter dates MUST be quoted strings (`"2026-08-29"`, `"2026-09-17T17:30"`); the loader rejects YAML Date objects.
- All commands run from repo root; tests: `bun test apps/web/...`, lint: `bun run check:fix`.
- Follow existing idioms: `font-display` headings, `rounded-3xl bg-brand-cream/5 hover:bg-brand-cream/10` cards, coral eyebrows (`font-display text-sm font-bold tracking-widest text-brand-coral uppercase`), page column `max-w-[60em] py-12 md:py-16`.
- Do not use `.squircle` on these cards (memory: filter mangles corners; keep parity with HubPage which doesn't use it).
- `output: 'standalone'`: runtime fs reads (sitemap) need `outputFileTracingIncludes`.
- Commit messages follow repo style (`feat(web): …`, lowercase, no period) + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Content library (`lib/content.ts`)

**Files:**
- Modify: `apps/web/package.json` (add `next-mdx-remote`, `gray-matter`)
- Create: `apps/web/lib/content.ts`
- Test: `apps/web/lib/content.spec.ts`

**Interfaces (Produces):**
- `PostMeta { slug, title, excerpt, date, category, image? }` (all strings)
- `EventMeta { slug, title, excerpt, startDate, endDate?, location, city, rsvpUrl?, price?, image? }`
- `getAllPosts(): PostMeta[]` (newest first), `getPost(slug): { meta: PostMeta; content: string }`, `getPostSlugs(): string[]`
- `getAllEvents(): EventMeta[]`, `getEvent(slug): { meta: EventMeta; content: string }`, `getEventSlugs(): string[]`
- `splitEvents(events, now): { upcoming: EventMeta[]; past: EventMeta[] }`
- `parseLocalDate(value): Date`, `formatPostDate(date): string`, `formatEventDate(start): string`, `formatEventTime(start, end?): string`, `formatEventBadge(start): { day: string; month: string }`
- Pure parsers exported for tests: `parsePostMeta(slug, data)`, `parseEventMeta(slug, data)`, `sortPosts(posts)`

- [ ] **Step 1: Install deps** — `cd apps/web && bun add next-mdx-remote gray-matter` (run via repo root: `bun add --cwd apps/web next-mdx-remote gray-matter` or cd). Commit `bun.lock` + `package.json` together with this task.

- [ ] **Step 2: Write failing tests** (`apps/web/lib/content.spec.ts`):

```ts
import { describe, expect, it } from 'bun:test'
import {
  formatEventBadge,
  formatEventDate,
  formatEventTime,
  formatPostDate,
  parseEventMeta,
  parseLocalDate,
  parsePostMeta,
  sortPosts,
  splitEvents,
} from './content'

const post = (slug: string, date: string) =>
  parsePostMeta(slug, {
    title: 'T',
    excerpt: 'E',
    date,
    category: 'Nyhet',
  })

describe('parsePostMeta', () => {
  it('returns a validated PostMeta', () => {
    expect(post('hej', '2026-08-18')).toEqual({
      slug: 'hej',
      title: 'T',
      excerpt: 'E',
      date: '2026-08-18',
      category: 'Nyhet',
    })
  })

  it('throws on missing fields, naming the file', () => {
    expect(() => parsePostMeta('trasig', { title: 'T' })).toThrow(/trasig/)
  })

  it('rejects unquoted YAML dates (Date objects)', () => {
    expect(() =>
      parsePostMeta('datum', {
        title: 'T',
        excerpt: 'E',
        date: new Date(),
        category: 'Nyhet',
      }),
    ).toThrow(/citera|quote/i)
  })
})

describe('parseEventMeta', () => {
  it('returns a validated EventMeta with optionals', () => {
    const meta = parseEventMeta('aw', {
      title: 'AW',
      excerpt: 'E',
      startDate: '2026-09-17T17:30',
      location: 'Baren',
      city: 'Stockholm',
      rsvpUrl: 'https://example.com',
      price: 'Gratis',
    })
    expect(meta.startDate).toBe('2026-09-17T17:30')
    expect(meta.endDate).toBeUndefined()
  })
})

describe('sortPosts', () => {
  it('sorts newest first', () => {
    const sorted = sortPosts([post('a', '2026-01-01'), post('b', '2026-06-01')])
    expect(sorted.map((p) => p.slug)).toEqual(['b', 'a'])
  })
})

describe('splitEvents', () => {
  const ev = (slug: string, startDate: string, endDate?: string) =>
    parseEventMeta(slug, {
      title: 'T',
      excerpt: 'E',
      startDate,
      endDate,
      location: 'L',
      city: 'C',
    })
  const now = parseLocalDate('2026-08-29T12:00')

  it('splits into upcoming (asc) and past (desc)', () => {
    const { upcoming, past } = splitEvents(
      [
        ev('okt', '2026-10-08T17:00'),
        ev('maj', '2026-05-21T17:30'),
        ev('sep', '2026-09-17T17:30'),
        ev('feb', '2026-02-26T18:00'),
      ],
      now,
    )
    expect(upcoming.map((e) => e.slug)).toEqual(['sep', 'okt'])
    expect(past.map((e) => e.slug)).toEqual(['maj', 'feb'])
  })

  it('keeps an in-progress event (endDate in the future) upcoming', () => {
    const { upcoming } = splitEvents(
      [ev('pagar', '2026-08-29T10:00', '2026-08-29T18:00')],
      now,
    )
    expect(upcoming).toHaveLength(1)
  })
})

describe('date formatting (sv-SE)', () => {
  it('formats post dates', () => {
    expect(formatPostDate('2026-08-18')).toBe('18 augusti 2026')
  })
  it('formats event dates with weekday', () => {
    expect(formatEventDate('2026-09-17T17:30')).toBe('torsdag 17 september 2026')
  })
  it('formats time ranges', () => {
    expect(formatEventTime('2026-09-17T17:30', '2026-09-17T20:00')).toBe(
      '17:30–20:00',
    )
    expect(formatEventTime('2026-09-17T17:30')).toBe('17:30')
  })
  it('builds the calendar badge', () => {
    expect(formatEventBadge('2026-09-17T17:30')).toEqual({
      day: '17',
      month: 'sep',
    })
  })
})
```

- [ ] **Step 3: Run** `bun test apps/web/lib/content.spec.ts` — FAIL (module not found).

- [ ] **Step 4: Implement `apps/web/lib/content.ts`:**

```ts
// Loads the MDX content that drives /nyheter and /event. Files live in
// apps/web/content/<section>/<slug>.mdx with YAML frontmatter; this
// module is server-side only (fs) — call it from getStaticProps/Paths.
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface PostMeta {
  slug: string
  title: string
  excerpt: string
  /** "YYYY-MM-DD" */
  date: string
  category: string
  image?: string
}

export interface EventMeta {
  slug: string
  title: string
  excerpt: string
  /** "YYYY-MM-DDTHH:mm", local Swedish time */
  startDate: string
  endDate?: string
  location: string
  city: string
  rsvpUrl?: string
  price?: string
  image?: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/

/** Parses "YYYY-MM-DD[THH:mm]" as local time (avoids the UTC shift that
 * `new Date("YYYY-MM-DD")` causes on machines west of UTC). */
export const parseLocalDate = (value: string): Date => {
  const m = value.match(DATE_PATTERN)
  if (!m) {
    throw new Error(
      `Ogiltigt datum "${value}" — använd "YYYY-MM-DD" eller "YYYY-MM-DDTHH:mm"`,
    )
  }
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0))
}

// js-yaml turns unquoted dates into Date objects parsed as UTC, which
// silently shifts event times — force authors to quote them instead.
const field = (
  data: Record<string, unknown>,
  key: string,
  slug: string,
  required: boolean,
): string | undefined => {
  const value = data[key]
  if (value === undefined || value === null) {
    if (!required) return undefined
    throw new Error(`${slug}: frontmatter saknar "${key}"`)
  }
  if (value instanceof Date) {
    throw new Error(`${slug}: citera datumet i "${key}" (t.ex. "2026-08-29")`)
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${slug}: frontmatter "${key}" måste vara en icke-tom sträng`)
  }
  return value
}

const dateField = (
  data: Record<string, unknown>,
  key: string,
  slug: string,
  required: boolean,
): string | undefined => {
  const value = field(data, key, slug, required)
  if (value !== undefined) parseLocalDate(value)
  return value
}

export const parsePostMeta = (
  slug: string,
  data: Record<string, unknown>,
): PostMeta => ({
  slug,
  title: field(data, 'title', slug, true)!,
  excerpt: field(data, 'excerpt', slug, true)!,
  date: dateField(data, 'date', slug, true)!,
  category: field(data, 'category', slug, true)!,
  ...(field(data, 'image', slug, false) && {
    image: field(data, 'image', slug, false),
  }),
})

export const parseEventMeta = (
  slug: string,
  data: Record<string, unknown>,
): EventMeta => {
  const optional = (key: string) => {
    const value = field(data, key, slug, false)
    return value !== undefined ? { [key]: value } : {}
  }
  return {
    slug,
    title: field(data, 'title', slug, true)!,
    excerpt: field(data, 'excerpt', slug, true)!,
    startDate: dateField(data, 'startDate', slug, true)!,
    ...(dateField(data, 'endDate', slug, false) && {
      endDate: dateField(data, 'endDate', slug, false),
    }),
    location: field(data, 'location', slug, true)!,
    city: field(data, 'city', slug, true)!,
    ...optional('rsvpUrl'),
    ...optional('price'),
    ...optional('image'),
  }
}

export const sortPosts = (posts: PostMeta[]): PostMeta[] =>
  [...posts].sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  )

export const splitEvents = (
  events: EventMeta[],
  now: Date,
): { upcoming: EventMeta[]; past: EventMeta[] } => {
  const upcoming: EventMeta[] = []
  const past: EventMeta[] = []
  for (const event of events) {
    const ends = parseLocalDate(event.endDate ?? event.startDate)
    ;(ends >= now ? upcoming : past).push(event)
  }
  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate))
  past.sort((a, b) => b.startDate.localeCompare(a.startDate))
  return { upcoming, past }
}

// --- Formatting (sv-SE, no date library) ---

const postDateFormat = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const eventDateFormat = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
})

const monthBadgeFormat = new Intl.DateTimeFormat('sv-SE', { month: 'short' })

export const formatPostDate = (date: string): string =>
  postDateFormat.format(parseLocalDate(date))

export const formatEventDate = (start: string): string =>
  eventDateFormat.format(parseLocalDate(start))

export const formatEventTime = (start: string, end?: string): string => {
  const from = timeFormat.format(parseLocalDate(start))
  return end ? `${from}–${timeFormat.format(parseLocalDate(end))}` : from
}

export const formatEventBadge = (
  start: string,
): { day: string; month: string } => {
  const date = parseLocalDate(start)
  return {
    day: String(date.getDate()),
    // sv-SE short months come with a trailing period ("sep.") — drop it.
    month: monthBadgeFormat.format(date).replace('.', ''),
  }
}

// --- Filesystem loaders (build/server only) ---

const listSlugs = (section: string): string[] =>
  fs
    .readdirSync(path.join(CONTENT_DIR, section))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort()

const readEntry = (section: string, slug: string) => {
  const raw = fs.readFileSync(
    path.join(CONTENT_DIR, section, `${slug}.mdx`),
    'utf8',
  )
  return matter(raw)
}

export const getPostSlugs = (): string[] => listSlugs('nyheter')
export const getEventSlugs = (): string[] => listSlugs('event')

export const getAllPosts = (): PostMeta[] =>
  sortPosts(
    getPostSlugs().map((slug) => parsePostMeta(slug, readEntry('nyheter', slug).data)),
  )

export const getAllEvents = (): EventMeta[] =>
  getEventSlugs().map((slug) => parseEventMeta(slug, readEntry('event', slug).data))

export const getPost = (slug: string): { meta: PostMeta; content: string } => {
  const { data, content } = readEntry('nyheter', slug)
  return { meta: parsePostMeta(slug, data), content }
}

export const getEvent = (slug: string): { meta: EventMeta; content: string } => {
  const { data, content } = readEntry('event', slug)
  return { meta: parseEventMeta(slug, data), content }
}
```

- [ ] **Step 5: Run** `bun test apps/web/lib/content.spec.ts` — PASS. (If `formatEventTime` returns "17.30" instead of "17:30" on this ICU, adjust the test to the actual sv-SE output — the format must simply be consistent.)

- [ ] **Step 6: Commit** `feat(web): content library for mdx posts and events`

### Task 2: Register routes and nav

**Files:**
- Modify: `apps/web/lib/routes.ts` (ROUTES + Community NAV_TAB)
- Modify: `apps/web/lib/routes.spec.ts` (skip `[slug]` files in the pages-coverage walk)

**Interfaces (Produces):** `getRoute('/nyheter')` and `getRoute('/event')` resolve; Community tab lists Nyheter + Event.

- [ ] **Step 1:** Add to `ROUTES` (in the Community block, before `/om`):

```ts
{
  path: '/nyheter',
  title: 'Nyheter',
  description:
    'Nyheter från Frilansare Sverige — uppdateringar från communityt, sajten och frilanslivet i Sverige.',
},
{
  path: '/event',
  title: 'Event',
  description:
    'Kommande träffar och event för frilansare — AW, workshops och årsmöten från Frilansare Sverige.',
},
```

- [ ] **Step 2:** In the Community `NAV_TABS` entry, add items first in the list:

```ts
items: [
  { path: '/nyheter', label: 'Nyheter' },
  { path: '/event', label: 'Event' },
  { path: '/om', label: 'Om oss' },
  { path: '/uppforandekod', label: 'Uppförandekod' },
  { path: '/kontakt', label: 'Kontakt' },
],
```

- [ ] **Step 3:** In `routes.spec.ts` `collectPageRoutes`, after the basename is computed, add:

```ts
if (basename.startsWith('[')) continue
```

(dynamic segments get their metadata from frontmatter, not the registry).

- [ ] **Step 4: Run** `bun test apps/web/lib/routes.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(web): register nyheter and event in the ia`

### Task 3: Sample content

**Files:**
- Create: `apps/web/content/nyheter/*.mdx` (6 posts), `apps/web/content/event/*.mdx` (4 events)
- Test: extend `apps/web/lib/content.spec.ts` with an integration block

**Interfaces (Consumes):** Task 1 loaders validate every file.

- [ ] **Step 1: Add integration test** to `content.spec.ts`:

```ts
import { getAllEvents, getAllPosts, getEvent, getPost } from './content'

describe('content directory', () => {
  it('parses every post and event on disk', () => {
    const posts = getAllPosts()
    const events = getAllEvents()
    expect(posts.length).toBeGreaterThanOrEqual(6)
    expect(events.length).toBeGreaterThanOrEqual(4)
    for (const p of posts) expect(getPost(p.slug).content.length).toBeGreaterThan(100)
    for (const e of events) expect(getEvent(e.slug).content.length).toBeGreaterThan(100)
  })
})
```

Run — FAIL (no content dir).

- [ ] **Step 2: Write the posts.** Frontmatter registry (dates quoted; categories: Nyhet / Uppdatering / Community). Bodies 150–300 words of natural Swedish MDX with `##` sections and the occasional list or blockquote — grounded in the community's real subject matter, no lorem ipsum:

| slug | title | category | date |
| --- | --- | --- | --- |
| `vi-ar-nu-6000-medlemmar` | Nu är vi 6 000 medlemmar | Community | 2026-08-18 |
| `nya-sajten-ar-har` | Nya sajten är här — byggd i det öppna | Uppdatering | 2026-07-02 |
| `sommarens-uppdragsstatistik` | Sommarens uppdrag: så såg marknaden ut | Nyhet | 2026-06-11 |
| `battre-taggar-i-uppdragskanalen` | Bättre taggar i uppdragskanalen | Uppdatering | 2026-05-20 |
| `frilansrapporten-2026` | Frilansrapporten 2026: fler tar steget | Nyhet | 2026-04-08 |
| `volontarer-till-communityt` | Vi söker volontärer till communityt | Community | 2026-03-14 |

Example (`vi-ar-nu-6000-medlemmar.mdx`) — the other five follow the same shape:

```mdx
---
title: "Nu är vi 6 000 medlemmar"
excerpt: "Sveriges största frilanscommunity fortsätter växa — och det är medlemmarna som gör jobbet."
date: "2026-08-18"
category: "Community"
---

I veckan passerade Frilansare Sverige 6 000 medlemmar. …

## Vad som händer härnäst

…
```

- [ ] **Step 3: Write the events** (today is 2026-08-29 → two upcoming, two past):

| slug | title | startDate | endDate | location | city | rsvpUrl | price |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `frilans-aw-stockholm-september` | Frilans-AW i Stockholm | "2026-09-17T17:30" | "2026-09-17T20:00" | Omnipollos hatt | Stockholm | https://example.com/aw-sthlm (placeholder OK to omit) | Gratis |
| `workshop-prissattning` | Workshop: Sätt rätt pris 2027 | "2026-10-08T17:00" | "2026-10-08T19:00" | Goto 10 | Göteborg | — | Gratis |
| `frilans-aw-goteborg-maj` | Frilans-AW i Göteborg | "2026-05-21T17:30" | "2026-05-21T20:00" | Steamy Pipes Craft Beer Bar | Göteborg | — | Gratis |
| `arsmote-2026` | Årsmöte 2026 | "2026-02-26T18:00" | "2026-02-26T19:30" | Digitalt (Zoom) | Online | — | Gratis |

For upcoming events without a real sign-up link, omit `rsvpUrl` rather than pointing at example.com — the detail page then simply shows the info panel without a button.

- [ ] **Step 4: Run** `bun test apps/web/lib/content.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(web): sample nyheter and event content`

### Task 4: Sitemap includes content URLs

**Files:**
- Modify: `apps/web/lib/sitemap.ts`, `apps/web/lib/sitemap.spec.ts`, `apps/web/pages/sitemap.xml.ts`, `apps/web/next.config.js`

**Interfaces (Produces):** `buildSitemapXml(baseUrl, extraPaths?: string[])`.

- [ ] **Step 1: Failing test** (extend `sitemap.spec.ts`):

```ts
it('appends extra paths after the registry routes', () => {
  const xml = buildSitemapXml('https://example.com', ['/nyheter/hej'])
  expect(xml).toContain('<loc>https://example.com/nyheter/hej</loc>')
})
```

- [ ] **Step 2: Implement:**

```ts
export const buildSitemapXml = (
  baseUrl: string,
  extraPaths: string[] = [],
): string => {
  const paths = [
    ...ROUTES.filter((route) => !route.noindex).map((route) => route.path),
    ...extraPaths,
  ]
  const urls = paths
    .map((p) => `  <url><loc>${baseUrl}${p}</loc></url>`)
    .join('\n')
  // …unchanged wrapper…
}
```

- [ ] **Step 3:** `pages/sitemap.xml.ts` builds the extras:

```ts
import { getEventSlugs, getPostSlugs } from '../lib/content'
// in getServerSideProps:
const extras = [
  ...getPostSlugs().map((slug) => `/nyheter/${slug}`),
  ...getEventSlugs().map((slug) => `/event/${slug}`),
]
res.write(buildSitemapXml(SITE_URL, extras))
```

- [ ] **Step 4:** `next.config.js` — content must survive standalone tracing for the runtime sitemap:

```js
outputFileTracingIncludes: {
  '/sitemap.xml': ['./content/**/*'],
},
```

- [ ] **Step 5: Run** `bun test apps/web/lib/sitemap.spec.ts` — PASS.
- [ ] **Step 6: Commit** `feat(web): content urls in the sitemap`

### Task 5: Breadcrumbs for dynamic pages

**Files:**
- Modify: `apps/web/components/Breadcrumbs.tsx`, `apps/web/components/Breadcrumbs.spec.tsx`, `apps/web/components/SiteFooter.tsx`, `apps/web/pages/_app.tsx`

**Interfaces (Produces):**
- `export interface LeafCrumb { section: string; path: string; label: string }`
- Pages opt in by returning `crumb: LeafCrumb` from `getStaticProps`; `_app` forwards `pageProps.crumb` through `SiteFooter` to `Breadcrumbs`.

- [ ] **Step 1: Failing test** (add to `Breadcrumbs.spec.tsx`):

```tsx
it('renders a dynamic leaf via the crumb prop', () => {
  render(
    <Breadcrumbs
      path="/nyheter/[slug]"
      crumb={{ section: '/nyheter', path: '/nyheter/hej', label: 'Hej världen' }}
    />,
  )
  expect(screen.getByRole('link', { name: 'Nyheter' })).toHaveAttribute(
    'href',
    '/nyheter',
  )
  expect(screen.getByText('Hej världen')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Hej världen' })).toBeNull()
})
```

- [ ] **Step 2: Implement.** Breadcrumbs:

```tsx
export interface LeafCrumb {
  section: string
  path: string
  label: string
}

const Breadcrumbs = ({ path, crumb }: { path: string; crumb?: LeafCrumb }) => {
  const crumbs = crumb
    ? [...getBreadcrumbs(crumb.section), { path: crumb.path, label: crumb.label }]
    : getBreadcrumbs(path)
  // …rest unchanged…
```

SiteFooter: accept and forward `crumb?: LeafCrumb`. `_app.tsx`: `<SiteFooter path={router.pathname} crumb={pageProps.crumb} />`.

- [ ] **Step 3: Run** `bun test apps/web/components/Breadcrumbs.spec.tsx` and the SiteFooter/SiteNav specs — PASS.
- [ ] **Step 4: Commit** `feat(web): breadcrumb support for dynamic content pages`

### Task 6: Cover + card components

**Files:**
- Create: `apps/web/components/nyheter/ArticleCover.tsx`, `apps/web/components/nyheter/ArticleCard.tsx`

**Interfaces (Produces):**
- `ArticleCover({ slug, title, image?, className? })` — renders `image` (plain `<img>` from `/public`) or a deterministic brand gradient; `aria-hidden` when decorative, fills its container.
- `ArticleCard({ post: PostMeta, featured?: boolean })` — whole card is a `next/link` to `/nyheter/${post.slug}`.

- [ ] **Step 1: ArticleCover** — hash the slug into one of five curated brand gradients (coral/coral-light/cream glows on blue/blue-dark) so archives get Apple-tile variety without binary assets:

```tsx
const GRADIENTS = [
  'radial-gradient(120% 160% at 85% 15%, #ffcfc8 0%, #ff9c8e 30%, #4823dc 75%)',
  'radial-gradient(140% 140% at 15% 85%, #ff9c8e 0%, #2601bb 60%, #4823dc 100%)',
  'linear-gradient(135deg, #2601bb 0%, #4823dc 45%, #ff9c8e 100%)',
  'radial-gradient(100% 180% at 50% 110%, #fffce3 0%, #ffcfc8 25%, #4823dc 70%)',
  'radial-gradient(150% 120% at 90% 90%, #ffcfc8 0%, #4823dc 55%, #2601bb 100%)',
]

const hash = (value: string): number => {
  let h = 0
  for (const char of value) h = (h * 31 + char.codePointAt(0)!) % 997
  return h
}
```

Render: `image` → `<img src={image} alt="" className="size-full object-cover" />`; else `<div aria-hidden className="size-full" style={{ background: GRADIENTS[hash(slug) % GRADIENTS.length] }} />`. Wrapper carries `className` for aspect ratio.

- [ ] **Step 2: ArticleCard** — Apple tile in brand dress:

```tsx
const ArticleCard = ({ post, featured = false }: { post: PostMeta; featured?: boolean }) => (
  <Link
    href={`/nyheter/${post.slug}`}
    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-brand-cream/5 transition-colors hover:bg-brand-cream/10"
  >
    <div className={featured ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[16/10]'}>
      <ArticleCover slug={post.slug} title={post.title} image={post.image} />
    </div>
    <div className={featured ? 'flex flex-col p-7 md:p-9' : 'flex flex-col p-6'}>
      <p className="font-display text-xs font-bold tracking-widest text-brand-coral uppercase">
        {post.category}
      </p>
      <h3 className={`font-display mt-2 font-bold tracking-tight text-brand-cream ${featured ? 'text-2xl md:text-4xl' : 'text-xl'}`}>
        {post.title}
      </h3>
      {featured && (
        <p className="mt-3 max-w-[36em] text-lg leading-[1.6] text-brand-cream/80">
          {post.excerpt}
        </p>
      )}
      <time dateTime={post.date} className="mt-3 text-sm text-brand-cream/60">
        {formatPostDate(post.date)}
      </time>
    </div>
  </Link>
)
```

- [ ] **Step 3:** `bun run check:fix` — clean. **Commit** `feat(web): article cover and card components`

### Task 7: `/nyheter` archive

**Files:**
- Create: `apps/web/pages/nyheter/index.tsx`

**Interfaces (Consumes):** `getAllPosts`, `ArticleCard`, `Seo`, `getRoute`.

- [ ] **Step 1: Implement** — featured latest + tile grid:

```tsx
import type { GetStaticProps } from 'next'
import ArticleCard from '../../components/nyheter/ArticleCard'
import Seo from '../../components/Seo'
import { getAllPosts, type PostMeta } from '../../lib/content'
import { getRoute } from '../../lib/routes'

interface Props {
  posts: PostMeta[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { posts: getAllPosts() },
})

const Nyheter = ({ posts }: Props) => {
  const meta = getRoute('/nyheter')!
  const [featured, ...rest] = posts
  return (
    <>
      <Seo title={meta.title} description={meta.description} path="/nyheter" />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Nyheter
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Det senaste från communityt, sajten och frilanslivet i Sverige.
        </p>
        {featured && (
          <div className="mt-10">
            <ArticleCard post={featured} featured />
          </div>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  )
}

export default Nyheter
```

- [ ] **Step 2:** `bun run dev`, eyeball `/nyheter`. **Commit** `feat(web): nyheter archive page`

### Task 8: Article page `/nyheter/[slug]`

**Files:**
- Create: `apps/web/components/nyheter/MdxContent.tsx`, `apps/web/pages/nyheter/[slug].tsx`
- Modify: `apps/web/components/Seo.tsx` (optional `type?: 'website' | 'article'` for `og:type`)

**Interfaces (Produces):** `MDX_COMPONENTS` map exported from `MdxContent.tsx` for both article and event pages.

- [ ] **Step 1: MdxContent** — brand prose map (no typography plugin):

```tsx
import type { MDXRemoteProps } from 'next-mdx-remote'

export const MDX_COMPONENTS: MDXRemoteProps['components'] = {
  h2: (props) => (
    <h2
      className="font-display mt-12 mb-4 text-2xl font-bold tracking-tight text-brand-cream md:text-3xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="font-display mt-8 mb-3 text-xl font-bold text-brand-cream" {...props} />
  ),
  p: (props) => <p className="my-5 leading-[1.7] text-brand-cream/85" {...props} />,
  a: (props) => (
    <a className="text-brand-coral underline underline-offset-2 hover:no-underline" {...props} />
  ),
  ul: (props) => (
    <ul className="my-5 list-disc space-y-2 pl-6 leading-[1.7] text-brand-cream/85" {...props} />
  ),
  ol: (props) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 leading-[1.7] text-brand-cream/85" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="font-display my-8 border-l-2 border-brand-coral pl-6 text-xl leading-[1.5] text-brand-cream"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-brand-cream" {...props} />,
  hr: () => <hr className="my-10 border-brand-cream/10" />,
}
```

- [ ] **Step 2: Seo og:type** — add `type` prop defaulting to `'website'`; render `<meta property="og:type" content={type} />`. Update `Seo.spec.tsx` only if it asserts og:type.

- [ ] **Step 3: Article page:**

```tsx
import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { NewsArticle, WithContext } from 'schema-dts'
import type { LeafCrumb } from '../../components/Breadcrumbs'
import ArticleCard from '../../components/nyheter/ArticleCard'
import ArticleCover from '../../components/nyheter/ArticleCover'
import { MDX_COMPONENTS } from '../../components/nyheter/MdxContent'
import Seo, { SITE_URL } from '../../components/Seo'
import StructuredData from '../../components/StructuredData'
import {
  formatPostDate,
  getAllPosts,
  getPost,
  getPostSlugs,
  type PostMeta,
} from '../../lib/content'

interface Props {
  meta: PostMeta
  source: MDXRemoteSerializeResult
  more: PostMeta[]
  crumb: LeafCrumb
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getPostSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string
  const { meta, content } = getPost(slug)
  const source = await serialize(content)
  const more = getAllPosts().filter((p) => p.slug !== slug).slice(0, 3)
  return {
    props: {
      meta,
      source,
      more,
      crumb: { section: '/nyheter', path: `/nyheter/${slug}`, label: meta.title },
    },
  }
}
```

Render: `<Seo type="article" …>`, NewsArticle JSON-LD (headline/description/datePublished/inLanguage 'sv'/author+publisher Organization "Frilansare Sverige"/mainEntityOfPage), then an `<article className="w-full max-w-[42em] py-12 md:py-16">`: coral category eyebrow + `<time>` on one row, `h1` extrabold 4xl/5xl, excerpt as `text-xl text-brand-cream/80` standfirst, `ArticleCover` in `aspect-[16/9] overflow-hidden rounded-3xl`, `<MDXRemote {...source} components={MDX_COMPONENTS} />`. Below the article, "Fler nyheter" (`h2` display font) + 3-column `ArticleCard` grid inside a `max-w-[60em]` section.

- [ ] **Step 4:** Eyeball an article in dev. **Commit** `feat(web): article page for nyheter`

### Task 9: `/event` archive

**Files:**
- Create: `apps/web/components/event/EventCard.tsx`, `apps/web/pages/event/index.tsx`

**Interfaces (Produces):** `EventCard({ event: EventMeta, past?: boolean })` — link row to `/event/${slug}` with calendar badge.

- [ ] **Step 1: EventCard:**

```tsx
const EventCard = ({ event, past = false }: { event: EventMeta; past?: boolean }) => {
  const badge = formatEventBadge(event.startDate)
  return (
    <Link
      href={`/event/${event.slug}`}
      className={`flex items-center gap-5 rounded-3xl bg-brand-cream/5 p-5 transition-colors hover:bg-brand-cream/10 sm:p-6 ${past ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-cream/10">
        <span className="font-display text-2xl leading-none font-extrabold text-brand-cream">
          {badge.day}
        </span>
        <span className="font-display mt-0.5 text-xs font-bold tracking-widest text-brand-coral uppercase">
          {badge.month}
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-lg font-bold tracking-tight text-brand-cream sm:text-xl">
          {event.title}
        </span>
        <span className="mt-1 text-sm text-brand-cream/70">
          {event.city} · {formatEventTime(event.startDate, event.endDate)} · {event.location}
        </span>
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Archive page** — `getStaticProps` computes `splitEvents(getAllEvents(), new Date())` at build time (a rebuild refreshes the split; acceptable for a static site and noted in the page comment). H1 "Event" + intro, "Kommande event" list (`flex flex-col gap-4`), then "Tidigare event" `h2` + list with `past`. If no upcoming events, an empty-state paragraph: "Inga inplanerade event just nu — håll utkik i Slacken."

- [ ] **Step 3:** Eyeball `/event`. **Commit** `feat(web): event archive page`

### Task 10: Event page `/event/[slug]`

**Files:**
- Create: `apps/web/pages/event/[slug].tsx`

**Interfaces (Consumes):** `getEvent`, `getEventSlugs`, `MDX_COMPONENTS`, `LeafCrumb`, formatters; schema-dts `Event as SchemaEvent`.

- [ ] **Step 1:** `getStaticPaths` from `getEventSlugs()`; `getStaticProps` serializes body, computes `isPast` (`parseLocalDate(endDate ?? startDate) < new Date()` at build), returns `crumb { section: '/event', … }`.

- [ ] **Step 2: Render.** `max-w-[42em]` column: coral "Event" eyebrow, `h1`, excerpt standfirst, then an info panel:

```tsx
<div className="mt-8 flex flex-col gap-4 rounded-3xl bg-brand-cream/5 p-7">
  {/* rows: icon-[lucide--calendar] formatEventDate · icon-[lucide--clock] formatEventTime
      · icon-[lucide--map-pin] {location}, {city} · icon-[lucide--ticket] {price} */}
  {/* each row: flex items-center gap-3; icon size-5 text-brand-coral; text text-brand-cream/85 */}
  {isPast ? (
    <p className="mt-2 text-brand-cream/60">Det här eventet har ägt rum.</p>
  ) : (
    meta.rsvpUrl && (
      <a
        href={meta.rsvpUrl}
        className="font-display mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand-coral px-6 py-3 font-bold text-brand-grey transition-transform hover:scale-[1.03]"
      >
        Anmäl dig
        <span aria-hidden="true" className="icon-[lucide--arrow-right] size-4" />
      </a>
    )
  )}
</div>
```

then the MDX body. JSON-LD `Event` (aliased `SchemaEvent`): name, description, startDate/endDate as authored, eventStatus EventScheduled, attendanceMode Offline (Mixed/Online when city is "Online"), location Place + PostalAddress (addressLocality city, addressCountry 'SE'), organizer Organization, and when `rsvpUrl`: offers `{ '@type': 'Offer', url, price: price === 'Gratis' ? '0' : price, priceCurrency: 'SEK', availability: 'https://schema.org/InStock' }`.

- [ ] **Step 3:** Eyeball both an upcoming and a past event. **Commit** `feat(web): single event page`

### Task 11: Full verification & visual QA

- [ ] **Step 1:** `bun test` (whole suite) — PASS.
- [ ] **Step 2:** `bun run check:fix` — clean tree.
- [ ] **Step 3:** `bun run build` — succeeds; confirm `/nyheter/*` and `/event/*` listed as SSG pages.
- [ ] **Step 4:** Visual pass in the browser (dev server + Chrome tools): `/nyheter`, one article, `/event`, one upcoming + one past event; check nav (Community tab shows Nyheter/Event), footer breadcrumbs on an article, mobile viewport (390px) and light theme. Fix what looks off.
- [ ] **Step 5:** Commit any fixes: `style(web): polish nyheter and event pages`
