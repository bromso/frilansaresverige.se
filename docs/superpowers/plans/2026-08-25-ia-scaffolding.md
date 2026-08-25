# IA Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved information architecture's skeleton for frilansaresverige.se — routes registry, SEO base, breadcrumbs, error/tack pages, sitemap/robots, Skiper96 expandable-tabs navigation, and all hub/content pages that don't require the editorial content program.

**Architecture:** A single routes registry (`apps/web/lib/routes.ts`) is the source of truth for the IA; the nav, footer, breadcrumbs, sitemap and 404 page all render from it. Pages are Next.js Pages Router files using a shared `<Seo>` component (next/head) and `<Breadcrumbs>` with JSON-LD. Forms redirect to real noindexed tack pages.

**Tech Stack:** Next.js ^16.2.9 (Pages Router, Turbopack), React 19, Tailwind v4 + `@iconify/tailwind4` (lucide icons), `motion/react` (v13, NOT framer-motion), `react-use-measure`, bun test + happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-08-25-information-architecture-design.md`

## Global Constraints

- Slugs: Swedish, ASCII only (å/ä→a, ö→o), lowercase, hyphenated.
- All indexable pages get `<Seo>` (title, description, canonical) and — everything except `/` and hub roots' direct children of Hem — `<Breadcrumbs>` with schema.org BreadcrumbList. Tack pages, 404, 500 are noindex.
- This repo's Next.js is newer than your training data. Before touching pages, skim `node_modules/next/dist/docs/02-pages/` for the relevant guide (custom-error, head, getStaticProps). `pages/404.tsx` and `pages/500.tsx` are confirmed valid conventions in this version.
- The repo uses the `motion` package: import from `'motion/react'`, never `framer-motion`.
- Icons are CSS classes from `@iconify/tailwind4`: `icon-[lucide--user-round]` etc. All icon names used in this plan are verified to exist in the installed `@iconify-json/lucide`.
- Tests import from `bun:test` (`describe`, `it`, `expect`, `jest`) and `@testing-library/react`. Run per-file from `apps/web/`: `bun test --preload ../../test-setup.ts <path>`.
- Swedish copy in this plan is final copy — don't invent policy or claims not already on the site.
- Site URL for canonicals: `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://frilansaresverige.se'`.
- Commit after every task with a conventional-commit message ending in the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.
- Existing visual language: pages are sections inside the `_app.tsx` main column; headings use `font-display`, eyebrow labels use `text-brand-coral uppercase tracking-widest`, body text `text-brand-cream/85`. Copy an existing page (e.g. `pages/tipsa/index.tsx`) for framing before writing a new one.

---

### Task 1: Routes registry

**Files:**
- Create: `apps/web/lib/routes.ts`
- Test: `apps/web/lib/routes.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (all later tasks rely on these exact names):

```ts
export interface RouteMeta {
  path: string        // '/for-frilansare'
  title: string       // page <title> half, e.g. 'För frilansare'
  description: string // meta description
  parent?: string     // breadcrumb parent path; undefined = child of '/'
  noindex?: boolean
}
export interface NavTab {
  title: string  // 'Frilansare'
  icon: string   // 'icon-[lucide--user-round]'
  hub: string    // '/for-frilansare'
  items: { path: string; label: string }[]
}
export const ROUTES: RouteMeta[]
export const NAV_TABS: NavTab[]
export const LEGAL_ROUTES: { path: string; label: string }[]
export function getRoute(path: string): RouteMeta | undefined
export function getBreadcrumbs(path: string): { path: string; label: string }[]
// getBreadcrumbs('/uppforandekod') === [
//   { path: '/', label: 'Hem' },
//   { path: '/community', label: 'Community' },
//   { path: '/uppforandekod', label: 'Uppförandekod' },
// ]
```

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/lib/routes.spec.ts
import { describe, expect, it } from 'bun:test'
import { getBreadcrumbs, getRoute, NAV_TABS, ROUTES } from './routes'

describe('routes registry', () => {
  it('contains the five nav tabs in IA order', () => {
    expect(NAV_TABS.map((t) => t.title)).toEqual([
      'Frilansare',
      'Företag',
      'Uppdrag',
      'Kunskap',
      'Community',
    ])
  })

  it('every nav item points at a registered route', () => {
    const paths = new Set(ROUTES.map((r) => r.path))
    for (const tab of NAV_TABS) {
      expect(paths.has(tab.hub)).toBe(true)
      for (const item of tab.items) {
        expect(paths.has(item.path)).toBe(true)
      }
    }
  })

  it('every parent reference resolves to a registered route', () => {
    const paths = new Set(ROUTES.map((r) => r.path))
    for (const route of ROUTES) {
      if (route.parent) {
        expect(paths.has(route.parent)).toBe(true)
      }
    }
  })

  it('looks up a route by path', () => {
    expect(getRoute('/ansokan')?.title).toBe('Ansök om medlemskap')
    expect(getRoute('/finns-inte')).toBeUndefined()
  })

  it('builds breadcrumbs from the parent chain', () => {
    expect(getBreadcrumbs('/uppforandekod')).toEqual([
      { path: '/', label: 'Hem' },
      { path: '/community', label: 'Community' },
      { path: '/uppforandekod', label: 'Uppförandekod' },
    ])
  })

  it('marks tack pages noindex', () => {
    expect(getRoute('/ansokan/tack')?.noindex).toBe(true)
    expect(getRoute('/tipsa/tack')?.noindex).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `apps/web/`): `bun test --preload ../../test-setup.ts lib/routes.spec.ts`
Expected: FAIL — cannot resolve module `./routes`.

- [ ] **Step 3: Implement the registry**

```ts
// apps/web/lib/routes.ts

// Single source of truth for the site's information architecture (see
// docs/superpowers/specs/2026-08-25-information-architecture-design.md).
// The nav tabs, footer, breadcrumbs, sitemap.xml and 404 page all render
// from this file, so adding a page here is what makes it exist site-wide.

export interface RouteMeta {
  path: string
  title: string
  description: string
  parent?: string
  noindex?: boolean
}

export interface NavTab {
  title: string
  icon: string
  hub: string
  items: { path: string; label: string }[]
}

export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: 'Sveriges största community för frilansare',
    description:
      'Frilansare Sverige är ett gratis community där frilansare delar uppdrag, kunskap och kollegskap — utan mellanhänder.',
  },

  // För frilansare
  {
    path: '/for-frilansare',
    title: 'För frilansare',
    description:
      'Det här får du som medlem i Frilansare Sverige: uppdragstips, kollegor i hela landet och svar på frilanslivets frågor — helt gratis.',
  },
  {
    path: '/ansokan',
    title: 'Ansök om medlemskap',
    description:
      'Ansök om medlemskap i Frilansare Sverige. Gratis, tar ett par minuter, och du får en inbjudan till vår Slack via mejl.',
    parent: '/for-frilansare',
  },
  {
    path: '/ansokan/tack',
    title: 'Tack för din ansökan',
    description: 'Din ansökan är inskickad.',
    parent: '/ansokan',
    noindex: true,
  },
  {
    path: '/sa-fungerar-det',
    title: 'Så fungerar communityt',
    description:
      'Så fungerar Frilansare Sverige: ansökan, Slack-kanalerna, uppdragstipsen och reglerna som håller communityt schysst.',
    parent: '/for-frilansare',
  },
  {
    path: '/fragor-och-svar',
    title: 'Frågor och svar',
    description:
      'Vanliga frågor om Frilansare Sverige: vem som kan bli medlem, vad det kostar och hur ansökan går till.',
    parent: '/for-frilansare',
  },

  // För företag
  {
    path: '/for-foretag',
    title: 'För företag',
    description:
      'Nå Sveriges största frilanscommunity direkt: tipsa om uppdrag gratis och kom i kontakt med frilansare utan mellanhänder.',
  },
  {
    path: '/tipsa',
    title: 'Tipsa om konsultuppdrag',
    description:
      'Har du ett uppdrag som passar en frilansare? Tipsa communityt gratis — uppdraget når tusentals frilansare direkt.',
    parent: '/for-foretag',
  },
  {
    path: '/tipsa/tack',
    title: 'Tack för tipset',
    description: 'Uppdraget är inskickat till communityt.',
    parent: '/tipsa',
    noindex: true,
  },
  {
    path: '/anlita-frilansare',
    title: 'Anlita en frilansare',
    description:
      'Hitta rätt konsult i Sveriges största frilanscommunity — utvecklare, designers, skribenter och fler. Direktkontakt, inga mellanhänder.',
    parent: '/for-foretag',
  },

  // Uppdrag
  {
    path: '/uppdrag',
    title: 'Lediga frilans- och konsultuppdrag',
    description:
      'Lediga frilansuppdrag och konsultuppdrag från Frilansare Sveriges community — tipsade av medlemmar, utan mellanhänder.',
  },

  // Kunskap
  {
    path: '/kunskap',
    title: 'Kunskap för frilansare',
    description:
      'Guider, verktyg och svar för dig som frilansar i Sverige — från fakturering och skatt till timpris och avtal.',
  },

  // Community
  {
    path: '/community',
    title: 'Community',
    description:
      'Lär känna communityt bakom Frilansare Sverige: vilka vi är, hur du når oss och vad som gäller i vår Slack.',
  },
  {
    path: '/om',
    title: 'Om Frilansare Sverige',
    description:
      'Frilansare Sverige är ett ideellt, medlemsdrivet community med öppen källkod. Läs om varför vi finns och hur vi drivs.',
    parent: '/community',
  },
  {
    path: '/kontakt',
    title: 'Kontakt',
    description:
      'Kontakta Frilansare Sverige — frågor om medlemskap, uppdrag, press eller sajten.',
    parent: '/community',
  },
  {
    path: '/uppforandekod',
    title: 'Uppförandekod',
    description:
      'Uppförandekoden för Frilansare Sveriges community: så håller vi Slacken schysst, hjälpsam och fri från spam.',
    parent: '/community',
  },

  // Legal (footer only)
  {
    path: '/integritetspolicy',
    title: 'Integritetspolicy',
    description:
      'Så hanterar Frilansare Sverige dina personuppgifter när du ansöker om medlemskap eller tipsar om uppdrag.',
  },
  {
    path: '/cookies',
    title: 'Cookies',
    description: 'Så använder frilansaresverige.se cookies och lokal lagring.',
  },
  {
    path: '/villkor',
    title: 'Villkor',
    description:
      'Villkor för medlemskap och användning av Frilansare Sveriges community och sajt.',
  },
]

export const NAV_TABS: NavTab[] = [
  {
    title: 'Frilansare',
    icon: 'icon-[lucide--user-round]',
    hub: '/for-frilansare',
    items: [
      { path: '/ansokan', label: 'Bli medlem' },
      { path: '/sa-fungerar-det', label: 'Så fungerar det' },
      { path: '/fragor-och-svar', label: 'Frågor och svar' },
    ],
  },
  {
    title: 'Företag',
    icon: 'icon-[lucide--building-2]',
    hub: '/for-foretag',
    items: [
      { path: '/tipsa', label: 'Tipsa om uppdrag' },
      { path: '/anlita-frilansare', label: 'Anlita en frilansare' },
    ],
  },
  {
    title: 'Uppdrag',
    icon: 'icon-[lucide--briefcase-business]',
    hub: '/uppdrag',
    items: [],
  },
  {
    title: 'Kunskap',
    icon: 'icon-[lucide--book-open]',
    hub: '/kunskap',
    items: [{ path: '/fragor-och-svar', label: 'Frågor och svar' }],
  },
  {
    title: 'Community',
    icon: 'icon-[lucide--heart-handshake]',
    hub: '/community',
    items: [
      { path: '/om', label: 'Om oss' },
      { path: '/uppforandekod', label: 'Uppförandekod' },
      { path: '/kontakt', label: 'Kontakt' },
    ],
  },
]

export const LEGAL_ROUTES = [
  { path: '/integritetspolicy', label: 'Integritetspolicy' },
  { path: '/cookies', label: 'Cookies' },
  { path: '/villkor', label: 'Villkor' },
]

const byPath = new Map(ROUTES.map((route) => [route.path, route]))

export const getRoute = (path: string): RouteMeta | undefined =>
  byPath.get(path)

export function getBreadcrumbs(
  path: string,
): { path: string; label: string }[] {
  const crumbs: { path: string; label: string }[] = []
  let current = byPath.get(path)
  while (current) {
    crumbs.unshift({ path: current.path, label: current.title })
    current = current.parent ? byPath.get(current.parent) : undefined
  }
  if (crumbs[0]?.path !== '/') {
    crumbs.unshift({ path: '/', label: 'Hem' })
  } else {
    crumbs[0] = { path: '/', label: 'Hem' }
  }
  return crumbs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts lib/routes.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/routes.ts apps/web/lib/routes.spec.ts
git commit -m "feat(web): add routes registry as IA source of truth"
```

---

### Task 2: Seo component

**Files:**
- Create: `apps/web/components/Seo.tsx`
- Test: `apps/web/components/Seo.spec.tsx`

**Interfaces:**
- Consumes: `getRoute(path)` from Task 1 (optional convenience).
- Produces:

```tsx
export const SITE_NAME = 'Frilansare Sverige'
export const SITE_URL: string // env NEXT_PUBLIC_SITE_URL ?? 'https://frilansaresverige.se'
export interface SeoProps {
  title: string
  description: string
  path: string       // '/ansokan' — used for canonical
  noindex?: boolean
}
export function buildSeoTags(props: SeoProps): {
  title: string      // 'Ansök om medlemskap – Frilansare Sverige' ('/' gets 'Frilansare Sverige – <title>')
  description: string
  canonical: string  // `${SITE_URL}${path}`, no trailing slash added
  robots: string | null  // 'noindex,nofollow' or null
}
const Seo: (props: SeoProps) => ReactElement  // default export, renders next/head
```

- [ ] **Step 1: Write the failing test** (test the pure builder — next/head doesn't mount into happy-dom's `<head>`, so the component itself gets only a smoke render)

```tsx
// apps/web/components/Seo.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'
import Seo, { buildSeoTags, SITE_URL } from './Seo'

describe('buildSeoTags', () => {
  it('appends the site name to inner pages', () => {
    const tags = buildSeoTags({
      title: 'Ansök om medlemskap',
      description: 'desc',
      path: '/ansokan',
    })
    expect(tags.title).toBe('Ansök om medlemskap – Frilansare Sverige')
    expect(tags.canonical).toBe(`${SITE_URL}/ansokan`)
    expect(tags.robots).toBeNull()
  })

  it('leads with the site name on the home page', () => {
    const tags = buildSeoTags({
      title: 'Sveriges största community för frilansare',
      description: 'desc',
      path: '/',
    })
    expect(tags.title).toBe(
      'Frilansare Sverige – Sveriges största community för frilansare',
    )
    expect(tags.canonical).toBe(`${SITE_URL}/`)
  })

  it('emits robots noindex when asked', () => {
    const tags = buildSeoTags({
      title: 'Tack',
      description: 'desc',
      path: '/tipsa/tack',
      noindex: true,
    })
    expect(tags.robots).toBe('noindex,nofollow')
  })
})

describe('Seo', () => {
  it('renders without crashing', () => {
    render(<Seo title="T" description="D" path="/x" />)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts components/Seo.spec.tsx`
Expected: FAIL — cannot resolve `./Seo`.

- [ ] **Step 3: Implement**

```tsx
// apps/web/components/Seo.tsx
import Head from 'next/head'

export const SITE_NAME = 'Frilansare Sverige'
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://frilansaresverige.se'

export interface SeoProps {
  title: string
  description: string
  path: string
  noindex?: boolean
}

// Pure tag builder so the title/canonical/robots logic is unit-testable —
// next/head children never mount into happy-dom's <head>.
export const buildSeoTags = ({
  title,
  description,
  path,
  noindex,
}: SeoProps) => ({
  title:
    path === '/' ? `${SITE_NAME} – ${title}` : `${title} – ${SITE_NAME}`,
  description,
  canonical: `${SITE_URL}${path}`,
  robots: noindex ? 'noindex,nofollow' : null,
})

const Seo = (props: SeoProps) => {
  const tags = buildSeoTags(props)
  return (
    <Head>
      <title>{tags.title}</title>
      <meta name="description" content={tags.description} />
      <link rel="canonical" href={tags.canonical} />
      {tags.robots && <meta name="robots" content={tags.robots} />}
      <meta property="og:title" content={tags.title} />
      <meta property="og:description" content={tags.description} />
      <meta property="og:url" content={tags.canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="sv_SE" />
    </Head>
  )
}

export default Seo
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts components/Seo.spec.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Adopt on the three existing pages.** In `pages/index.tsx`, `pages/ansokan/index.tsx`, `pages/tipsa/index.tsx`: replace the current `<Head><title>…</title></Head>` block with `<Seo {...meta} />` where `meta` comes from the registry, e.g. in `ansokan/index.tsx`:

```tsx
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

// inside the component, replacing the <Head> block:
const meta = getRoute('/ansokan')!
// …
<Seo title={meta.title} description={meta.description} path={meta.path} />
```

Remove the now-unused `import Head from 'next/head'` in each file (index.tsx may keep `Head` if it sets other tags — check before removing).

- [ ] **Step 6: Verify in dev.** With `next dev` running, `curl -s localhost:3000/ansokan | grep -o '<title>[^<]*</title>\|rel="canonical"[^>]*'` shows the new title and canonical.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/Seo.tsx apps/web/components/Seo.spec.tsx apps/web/pages
git commit -m "feat(web): shared Seo component with canonical/OG/robots"
```

---

### Task 3: Breadcrumbs component

**Files:**
- Create: `apps/web/components/Breadcrumbs.tsx`
- Test: `apps/web/components/Breadcrumbs.spec.tsx`

**Interfaces:**
- Consumes: `getBreadcrumbs(path)` from Task 1.
- Produces: `const Breadcrumbs: ({ path }: { path: string }) => ReactElement | null` (default export). Renders `<nav aria-label="Brödsmulor">` with links for all but the last crumb, plus a `<script type="application/ld+json">` BreadcrumbList. Returns `null` when the trail is shorter than 2 items.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/components/Breadcrumbs.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import Breadcrumbs from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders the trail with the last crumb unlinked', () => {
    render(<Breadcrumbs path="/uppforandekod" />)
    const nav = screen.getByRole('navigation', { name: 'Brödsmulor' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hem' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute(
      'href',
      '/community',
    )
    expect(
      screen.queryByRole('link', { name: 'Uppförandekod' }),
    ).toBeNull()
    expect(screen.getByText('Uppförandekod')).toBeInTheDocument()
  })

  it('emits BreadcrumbList JSON-LD', () => {
    const { container } = render(<Breadcrumbs path="/uppforandekod" />)
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    )
    const data = JSON.parse(script!.textContent!)
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toHaveLength(3)
    expect(data.itemListElement[2].name).toBe('Uppförandekod')
  })

  it('renders nothing on the home page', () => {
    const { container } = render(<Breadcrumbs path="/" />)
    expect(container.innerHTML).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts components/Breadcrumbs.spec.tsx`
Expected: FAIL — cannot resolve `./Breadcrumbs`.

- [ ] **Step 3: Implement**

```tsx
// apps/web/components/Breadcrumbs.tsx
import Link from 'next/link'
import { getBreadcrumbs } from '../lib/routes'
import { SITE_URL } from './Seo'

const Breadcrumbs = ({ path }: { path: string }) => {
  const crumbs = getBreadcrumbs(path)
  if (crumbs.length < 2) {
    return null
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.path}`,
    })),
  }

  return (
    <nav aria-label="Brödsmulor" className="w-full pt-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-brand-cream/60">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="icon-[lucide--chevron-right] size-3.5"
                />
              )}
              {last ? (
                <span aria-current="page" className="text-brand-cream/85">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="hover:text-brand-cream hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  )
}

export default Breadcrumbs
```

(`icon-[lucide--chevron-right]` exists in the installed lucide set.)

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts components/Breadcrumbs.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/Breadcrumbs.tsx apps/web/components/Breadcrumbs.spec.tsx
git commit -m "feat(web): breadcrumbs with BreadcrumbList JSON-LD"
```

---

### Task 4: sitemap.xml and robots.txt

**Files:**
- Create: `apps/web/lib/sitemap.ts`
- Create: `apps/web/pages/sitemap.xml.ts`
- Create: `apps/web/public/robots.txt`
- Test: `apps/web/lib/sitemap.spec.ts`

**Interfaces:**
- Consumes: `ROUTES` from Task 1, `SITE_URL` from Task 2.
- Produces: `buildSitemapXml(baseUrl: string): string` — XML with one `<url>` per indexable route.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/lib/sitemap.spec.ts
import { describe, expect, it } from 'bun:test'
import { buildSitemapXml } from './sitemap'

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml('https://example.se')

  it('lists indexable routes with absolute urls', () => {
    expect(xml).toContain('<loc>https://example.se/</loc>')
    expect(xml).toContain('<loc>https://example.se/ansokan</loc>')
    expect(xml).toContain('<loc>https://example.se/uppforandekod</loc>')
  })

  it('excludes noindex routes', () => {
    expect(xml).not.toContain('/ansokan/tack')
    expect(xml).not.toContain('/tipsa/tack')
  })

  it('is a urlset document', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
      true,
    )
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts lib/sitemap.spec.ts`
Expected: FAIL — cannot resolve `./sitemap`.

- [ ] **Step 3: Implement builder + route**

```ts
// apps/web/lib/sitemap.ts
import { ROUTES } from './routes'

export const buildSitemapXml = (baseUrl: string): string => {
  const urls = ROUTES.filter((route) => !route.noindex)
    .map((route) => `  <url><loc>${baseUrl}${route.path}</loc></url>`)
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}
```

```ts
// apps/web/pages/sitemap.xml.ts
import type { GetServerSideProps } from 'next'
import { SITE_URL } from '../components/Seo'
import { buildSitemapXml } from '../lib/sitemap'

// The registry is static, so the XML is too — but a real page route (not
// a build artifact in public/) keeps it in lockstep with lib/routes.ts.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate',
  )
  res.write(buildSitemapXml(SITE_URL))
  res.end()
  return { props: {} }
}

const Sitemap = () => null
export default Sitemap
```

```
# apps/web/public/robots.txt
User-agent: *
Allow: /

Sitemap: https://frilansaresverige.se/sitemap.xml
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts lib/sitemap.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify in dev.** `curl -s localhost:3000/sitemap.xml | head -5` shows the XML; `curl -s localhost:3000/robots.txt` shows the robots file.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/sitemap.ts apps/web/lib/sitemap.spec.ts apps/web/pages/sitemap.xml.ts apps/web/public/robots.txt
git commit -m "feat(web): sitemap.xml from routes registry and robots.txt"
```

---

### Task 5: Custom 404 and 500 pages

**Files:**
- Create: `apps/web/pages/404.tsx`
- Create: `apps/web/pages/500.tsx`
- Test: `apps/web/pages/error-pages.spec.tsx`

**Interfaces:**
- Consumes: `NAV_TABS` (Task 1), `Seo` (Task 2).
- Produces: nothing downstream.

**Constraint (from spec):** `500.tsx` must render fine without client JS — plain static JSX only: no motion/react, no shader components, no hooks. `404.tsx` may use registry links but also stays static (it's SSG'd at build time).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/error-pages.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import Custom404 from './404'
import Custom500 from './500'

describe('404 page', () => {
  it('links to every hub and home', () => {
    render(<Custom404 />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Sidan finns inte',
    )
    for (const href of [
      '/',
      '/for-frilansare',
      '/for-foretag',
      '/uppdrag',
      '/kunskap',
      '/community',
    ]) {
      expect(
        screen
          .getAllByRole('link')
          .some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })
})

describe('500 page', () => {
  it('renders the minimal error message', () => {
    render(<Custom500 />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Något gick fel',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/error-pages.spec.tsx`
Expected: FAIL — cannot resolve `./404`.

- [ ] **Step 3: Implement**

```tsx
// apps/web/pages/404.tsx
import Link from 'next/link'
import Seo from '../components/Seo'
import { NAV_TABS } from '../lib/routes'

const Custom404 = () => (
  <section className="flex w-full max-w-[44em] flex-col items-start py-20 md:py-28">
    <Seo
      title="Sidan finns inte"
      description="Sidan du letar efter finns inte."
      path="/404"
      noindex
    />
    <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
      404
    </p>
    <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
      Sidan finns inte
    </h1>
    <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
      Länken kan vara gammal eller felstavad. Här är vägarna vidare — eller
      fråga i Slacken, där finns alltid någon som vet.
    </p>
    <ul className="mt-8 flex flex-wrap gap-3">
      <li>
        <Link
          href="/"
          className="inline-block rounded-full bg-brand-coral px-5 py-2 font-bold text-brand-grey"
        >
          Till startsidan
        </Link>
      </li>
      {NAV_TABS.map((tab) => (
        <li key={tab.hub}>
          <Link
            href={tab.hub}
            className="inline-block rounded-full border border-brand-cream/30 px-5 py-2 text-brand-cream/85 hover:border-brand-cream hover:text-brand-cream"
          >
            {tab.title}
          </Link>
        </li>
      ))}
    </ul>
  </section>
)

export default Custom404
```

```tsx
// apps/web/pages/500.tsx
import Seo from '../components/Seo'

// Deliberately dependency-free (no motion, no shaders, no hooks): if the
// server is unwell this page must still render as static HTML.
const Custom500 = () => (
  <section className="flex w-full max-w-[44em] flex-col items-start py-20 md:py-28">
    <Seo
      title="Något gick fel"
      description="Ett tekniskt fel inträffade."
      path="/500"
      noindex
    />
    <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
      500
    </p>
    <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
      Något gick fel
    </h1>
    <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
      Ett tekniskt fel inträffade på servern. Ladda om sidan om en stund —
      och om det fortsätter, säg till i Slacken eller öppna ett ärende på
      GitHub.
    </p>
    <a
      href="/"
      className="mt-8 inline-block rounded-full bg-brand-coral px-5 py-2 font-bold text-brand-grey"
    >
      Till startsidan
    </a>
  </section>
)

export default Custom500
```

(Plain `<a>` on the 500 page on purpose — no client router dependence.)

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/error-pages.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Verify in dev.** `curl -s -o /dev/null -w '%{http_code}' localhost:3000/finns-inte` → 404, and the page body renders the custom copy in a browser.

- [ ] **Step 6: Commit**

```bash
git add apps/web/pages/404.tsx apps/web/pages/500.tsx apps/web/pages/error-pages.spec.tsx
git commit -m "feat(web): custom 404 and dependency-free 500 pages"
```

---

### Task 6: Tack pages and form redirects

**Files:**
- Create: `apps/web/pages/ansokan/tack.tsx`
- Create: `apps/web/pages/tipsa/tack.tsx`
- Modify: `apps/web/components/GigTipForm.tsx` (success branch, ~lines 43–53)
- Modify: `apps/web/pages/ansokan/RequestSlackInvitationForm.tsx` (success branch, ~lines 50–61)
- Test: `apps/web/pages/tack-pages.spec.tsx`

**Interfaces:**
- Consumes: `Seo`, `Breadcrumbs`, `getRoute`.
- Produces: routes `/ansokan/tack`, `/tipsa/tack`.

**Behavior change:** on `data?.success` the forms navigate (`useRouter().push(...)`) instead of swapping to an inline Alert. Error stays inline. The success Alert code and `StatusSlide`'s success usage go away; keep `StatusSlide` for the error branch.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/tack-pages.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import AnsokanTack from './ansokan/tack'
import TipsaTack from './tipsa/tack'

describe('tack pages', () => {
  it('ansokan/tack confirms the application', () => {
    render(<AnsokanTack />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tack för din ansökan',
    )
  })

  it('tipsa/tack confirms the gig tip', () => {
    render(<TipsaTack />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tack för tipset',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/tack-pages.spec.tsx`
Expected: FAIL — cannot resolve `./ansokan/tack`.

- [ ] **Step 3: Implement the pages**

```tsx
// apps/web/pages/ansokan/tack.tsx
import Link from 'next/link'
import Breadcrumbs from '../../components/Breadcrumbs'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const AnsokanTack = () => {
  const meta = getRoute('/ansokan/tack')!
  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        path={meta.path}
        noindex
      />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col items-start py-16 md:py-24">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Ansökan inskickad
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Tack för din ansökan
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Grattis! Din ansökan är inskickad. Vi tittar på den och hör av oss
          via mejl så fort vi är klara — då kommer din inbjudan till Slacken.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Medan du väntar kan du läsa{' '}
          <Link href="/sa-fungerar-det" className="underline hover:no-underline">
            hur communityt fungerar
          </Link>{' '}
          eller kika på{' '}
          <Link href="/fragor-och-svar" className="underline hover:no-underline">
            vanliga frågor
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default AnsokanTack
```

```tsx
// apps/web/pages/tipsa/tack.tsx
import Link from 'next/link'
import Breadcrumbs from '../../components/Breadcrumbs'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const TipsaTack = () => {
  const meta = getRoute('/tipsa/tack')!
  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        path={meta.path}
        noindex
      />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col items-start py-16 md:py-24">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Tips inskickat
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Tack för tipset
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Uppdraget är inskickat till communityt. Frilansare som är
          intresserade hör av sig direkt till kontaktpersonen du angav —
          utan mellanhänder.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Har du fler uppdrag?{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            Tipsa igen
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default TipsaTack
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/tack-pages.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Redirect on success in both forms.** In `GigTipForm.tsx`: add `import { useRouter } from 'next/router'` and inside the component `const router = useRouter()`. Replace the whole `if (data?.success) { … }` block with:

```tsx
  useEffect(() => {
    if (data?.success) {
      void router.push('/tipsa/tack')
    }
  }, [data, router])
```

(add `useEffect` to the react import). Apply the same change in `RequestSlackInvitationForm.tsx` with `/ansokan/tack`. Delete the success `<Alert>` JSX in both; keep the error branch untouched.

- [ ] **Step 6: Run the full web test suite** — the hook specs (`useSubmitGigTipForm.spec.ts`, `useSubmitSlackInvitationForm` spec if present) test the hooks, not the components, so they should still pass.

Run (from `apps/web/`): `bun run test`
Expected: PASS, no regressions.

- [ ] **Step 7: Verify in browser.** Submit the tipsa form on localhost (dev API route accepts it or mock by filling required fields); confirm navigation to `/tipsa/tack`.

- [ ] **Step 8: Commit**

```bash
git add apps/web/pages/ansokan/tack.tsx apps/web/pages/tipsa/tack.tsx apps/web/pages/tack-pages.spec.tsx apps/web/components/GigTipForm.tsx apps/web/pages/ansokan/RequestSlackInvitationForm.tsx
git commit -m "feat(web): real tack pages; forms redirect on success"
```

---

### Task 7: SiteNav — Skiper96 expandable tabs

**Files:**
- Create: `apps/web/components/SiteNav.tsx`
- Modify: `apps/web/pages/_app.tsx` (header block, ~lines 57–82)
- Modify: `apps/web/package.json` (add dependency)
- Test: `apps/web/components/SiteNav.spec.tsx`

**Interfaces:**
- Consumes: `NAV_TABS` from Task 1.
- Produces: `const SiteNav: () => ReactElement` (default export) — rendered in the `_app.tsx` header between the logo and the theme-toggle/CTA group.

**Adaptation notes (from the Skiper96 reference the user provided):**
- `framer-motion` imports → `motion/react` (`AnimatePresence`, `motion`, `MotionConfig`).
- `react-use-measure` for the expanding panel height — add `"react-use-measure": "^2.1.7"` to `apps/web/package.json` dependencies (already in the workspace lockfile via packages/ui) and run `bun install`.
- Skip `usehooks-ts`: implement click-outside with a `useEffect` + `pointerdown` listener (code below).
- Lucide React icons → iconify span classes from `NAV_TABS[].icon`.
- The demo's dashboard/notification panels → our panel is a simple link list for the selected tab (hub link first, then `items`).
- Additional behavior the demo lacks: close on route change (`Router.events` `routeChangeStart`), close on Escape, `aria-expanded`/`aria-controls` on tab buttons, and respect reduced motion via the repo's `useReducedMotion` (skip spring animations: wrap in `MotionConfig transition={{ duration: 0 }}` when reduced).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/components/SiteNav.spec.tsx
import { describe, expect, it } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { NAV_TABS } from '../lib/routes'
import SiteNav from './SiteNav'

describe('SiteNav', () => {
  it('renders one tab button per nav tab', () => {
    render(<SiteNav />)
    for (const tab of NAV_TABS) {
      expect(
        screen.getByRole('button', { name: tab.title }),
      ).toBeInTheDocument()
    }
  })

  it('expands a tab into its link panel', () => {
    render(<SiteNav />)
    const button = screen.getByRole('button', { name: 'Community' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Om oss' })).toHaveAttribute(
      'href',
      '/om',
    )
    expect(
      screen.getByRole('link', { name: 'Uppförandekod' }),
    ).toHaveAttribute('href', '/uppforandekod')
  })

  it('closes on Escape', () => {
    render(<SiteNav />)
    const button = screen.getByRole('button', { name: 'Företag' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('tabs without items link straight to the hub', () => {
    render(<SiteNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Uppdrag' }))
    expect(
      screen.getByRole('link', { name: /uppdrag/i }),
    ).toHaveAttribute('href', '/uppdrag')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts components/SiteNav.spec.tsx`
Expected: FAIL — cannot resolve `./SiteNav`.

- [ ] **Step 3: Add the dependency**

In `apps/web/package.json` dependencies add `"react-use-measure": "^2.1.7"`, then run `bun install` at the repo root.

- [ ] **Step 4: Implement**

```tsx
// apps/web/components/SiteNav.tsx
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { cn } from '@frilansaresverige/ui/lib/utils'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import Link from 'next/link'
import Router from 'next/router'
import { useEffect, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'
import { NAV_TABS } from '../lib/routes'

// Site navigation adapted from Skiper UI's Skiper96 expandable tabs
// (skiper-ui.com): five icon tabs that expand to show their label on
// selection, with a panel above listing the section's pages. Changes
// from the demo: framer-motion → this repo's motion package,
// lucide-react → iconify classes, usehooks-ts click-outside → a local
// pointerdown listener, plus Escape/route-change closing, aria-expanded
// for keyboard users, and instant transitions under reduced motion.
const transition = {
  delay: 0.1,
  type: 'spring' as const,
  bounce: 0,
  duration: 0.6,
}

const SiteNav = () => {
  const [selected, setSelected] = useState<number | null>(null)
  const [direction, setDirection] = useState(1)
  const [panelRef, bounds] = useMeasure()
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const close = () => setSelected(null)
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    Router.events.on('routeChangeStart', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      Router.events.off('routeChangeStart', close)
    }
  }, [])

  const selectTab = (index: number) => {
    if (selected === index) {
      setSelected(null)
      return
    }
    if (selected !== null) {
      setDirection(index > selected ? 1 : -1)
    }
    setSelected(index)
  }

  const tab = selected === null ? null : NAV_TABS[selected]

  return (
    <div ref={containerRef} className="relative">
      <MotionConfig
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.5, type: 'spring', bounce: 0 }
        }
      >
        <nav
          aria-label="Huvudmeny"
          className="flex h-10 items-center gap-1 rounded-2xl bg-brand-cream/5 p-1"
        >
          {NAV_TABS.map((navTab, index) => (
            <motion.button
              key={navTab.title}
              type="button"
              initial={false}
              animate={{
                gap: selected === index ? '.5rem' : 0,
                paddingLeft: selected === index ? '1rem' : '.5rem',
                paddingRight: selected === index ? '1rem' : '.5rem',
              }}
              onClick={() => selectTab(index)}
              aria-expanded={selected === index}
              aria-controls="site-nav-panel"
              className={cn(
                'flex h-full items-center justify-center rounded-xl text-sm font-medium transition-colors duration-300',
                selected === index
                  ? 'bg-brand-cream/10 text-brand-cream'
                  : 'text-brand-cream/70 hover:bg-brand-cream/10 hover:text-brand-cream',
              )}
            >
              <span aria-hidden="true" className={cn(navTab.icon, 'size-4 shrink-0')} />
              <AnimatePresence initial={false}>
                {selected === index ? (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : transition}
                    className="overflow-hidden font-medium tracking-tight whitespace-nowrap"
                  >
                    {navTab.title}
                  </motion.span>
                ) : (
                  <span className="sr-only">{navTab.title}</span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <motion.div
          id="site-nav-panel"
          initial={false}
          animate={{ height: tab ? bounds.height : 0 }}
          className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl bg-brand-blue-dark shadow-lg"
        >
          <div ref={panelRef}>
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              {tab && (
                <motion.ul
                  key={tab.title}
                  custom={direction}
                  variants={panelVariants}
                  initial="initial"
                  animate="active"
                  exit="exit"
                  className="flex flex-col gap-0.5 p-2"
                >
                  <li>
                    <Link
                      href={tab.hub}
                      className="flex h-10 items-center rounded-xl px-3 text-sm font-bold text-brand-cream hover:bg-brand-cream/10"
                    >
                      {tab.items.length === 0
                        ? tab.title
                        : `Allt om ${tab.title.toLowerCase()}`}
                    </Link>
                  </li>
                  {tab.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className="flex h-10 items-center rounded-xl px-3 text-sm text-brand-cream/85 hover:bg-brand-cream/10 hover:text-brand-cream"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  )
}

const panelVariants = {
  initial: (direction: number) => ({ x: `${110 * direction}%`, opacity: 0 }),
  active: { x: '0%', opacity: 1 },
  exit: (direction: number) => ({ x: `${-110 * direction}%`, opacity: 0 }),
}

export default SiteNav
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts components/SiteNav.spec.tsx`
Expected: PASS (4 tests). If AnimatePresence exit-nodes confuse `getByRole` queries, use `findByRole`/`await` variants — but with `initial={false}` and no unmount between assertions this should not be needed.

- [ ] **Step 6: Mount in the header.** In `pages/_app.tsx`, inside the header's inner flex div (currently logo → theme toggle + CTA button), render `<SiteNav />` between the logo `Link` and the right-hand group, hidden on small screens where it won't fit alongside the CTA:

```tsx
import SiteNav from '../components/SiteNav'
// …
<div className="mx-auto flex w-full max-w-[72em] items-center justify-between gap-4 px-[min(2em,4vw)] py-4">
  <Link href="/" …>…</Link>

  <div className="hidden md:block">
    <SiteNav />
  </div>

  <div className="flex items-center gap-3">…theme toggle + CTA…</div>
</div>
```

For `< md` screens the tabs render below the header row instead: add a second `<div className="flex justify-center pb-3 md:hidden"><SiteNav /></div>` directly under the inner flex div, still inside `<header>`. (Two instances are fine — state is local and only one is visible.)

- [ ] **Step 7: Verify in browser.** Desktop: five icon tabs; clicking expands label + panel; panel links navigate and close the panel; Escape and outside-click close. Mobile width (~375px): tabs row under the logo row, usable. Reduced motion (devtools emulation): no springs, panels appear instantly.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/SiteNav.tsx apps/web/components/SiteNav.spec.tsx apps/web/pages/_app.tsx apps/web/package.json bun.lock
git commit -m "feat(web): Skiper96-style expandable tabs site navigation"
```

---

### Task 8: Footer from the registry

**Files:**
- Modify: `apps/web/pages/_app.tsx` (footer `<nav aria-label="Sidfot">` block and surrounding columns, ~lines 111–170)
- Test: `apps/web/pages/app-footer.spec.tsx`

**Interfaces:**
- Consumes: `NAV_TABS`, `LEGAL_ROUTES` from Task 1.
- Produces: nothing downstream.

**Design:** replace the hand-rolled "Hitta rätt" link list with columns generated from `NAV_TABS` (each column: hub link as heading-link + its items), keep the external Uppdragsportalen link in the Uppdrag column, keep the om-oss blurb and GitHub column as-is, and add a bottom row with `LEGAL_ROUTES` links.

- [ ] **Step 1: Write the failing test.** Testing `MyApp` whole drags in shaders/fonts; instead extract the footer into its own component first (this is the implementation step's refactor), then test that component. Write the test against the new component:

```tsx
// apps/web/pages/app-footer.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import SiteFooter from '../components/SiteFooter'

describe('SiteFooter', () => {
  it('renders a column per nav tab with its links', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Bli medlem' })).toHaveAttribute(
      'href',
      '/ansokan',
    )
    expect(
      screen.getByRole('link', { name: 'Tipsa om uppdrag' }),
    ).toHaveAttribute('href', '/tipsa')
    expect(screen.getByRole('link', { name: 'Om oss' })).toHaveAttribute(
      'href',
      '/om',
    )
  })

  it('renders the legal links row', () => {
    render(<SiteFooter />)
    for (const legal of [
      ['Integritetspolicy', '/integritetspolicy'],
      ['Cookies', '/cookies'],
      ['Villkor', '/villkor'],
    ]) {
      expect(screen.getByRole('link', { name: legal[0] })).toHaveAttribute(
        'href',
        legal[1],
      )
    }
  })

  it('keeps the external portal link', () => {
    render(<SiteFooter />)
    expect(
      screen.getByRole('link', { name: 'Uppdragsportalen' }),
    ).toHaveAttribute('href', 'https://uppdrag.frilansaresverige.se/')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/app-footer.spec.tsx`
Expected: FAIL — cannot resolve `../components/SiteFooter`.

- [ ] **Step 3: Extract and implement `apps/web/components/SiteFooter.tsx`.** Move the entire `<footer>…</footer>` JSX out of `_app.tsx` into the new component (including the `LogoMark` usage — move `LogoMark` into `apps/web/components/LogoMark.tsx` and import it from both `_app.tsx` and `SiteFooter.tsx`). Then replace the "Hitta rätt" nav with generated columns:

```tsx
// inside SiteFooter's <footer>, replacing the old <nav aria-label="Sidfot">
<nav aria-label="Sidfot" className="flex flex-wrap gap-10">
  {NAV_TABS.map((tab) => (
    <div key={tab.hub}>
      <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-brand-coral uppercase">
        <Link href={tab.hub} className="hover:underline">
          {tab.title}
        </Link>
      </h2>
      <ul className="flex flex-col gap-2 text-brand-cream/85">
        {tab.items.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="hover:text-brand-cream hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
        {tab.hub === '/uppdrag' && (
          <li>
            <a
              href="https://uppdrag.frilansaresverige.se/"
              className="hover:text-brand-cream hover:underline"
            >
              Uppdragsportalen
            </a>
          </li>
        )}
      </ul>
    </div>
  ))}
</nav>
```

and after the columns wrapper, before `</footer>`:

```tsx
<div className="mx-auto flex w-full max-w-[72em] flex-wrap gap-x-6 gap-y-2 px-[min(2em,4vw)] pb-10 text-sm text-brand-cream/60">
  {LEGAL_ROUTES.map((legal) => (
    <Link
      key={legal.path}
      href={legal.path}
      className="hover:text-brand-cream hover:underline"
    >
      {legal.label}
    </Link>
  ))}
</div>
```

Keep the existing om-oss blurb and GitHub/öppen källkod column unchanged. Note the footer's bottom padding constraint (progressive blur strip) documented in the existing comment — preserve `pb-40` on the last content row or move the extra padding to the legal row.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/app-footer.spec.tsx`
Expected: PASS (3 tests). Also run the whole suite: `bun run test`.

- [ ] **Step 5: Verify in browser.** Footer shows five section columns + legal row in both themes; last row clears the progressive-blur strip.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/SiteFooter.tsx apps/web/components/LogoMark.tsx apps/web/pages/_app.tsx apps/web/pages/app-footer.spec.tsx
git commit -m "feat(web): registry-driven footer with legal links row"
```

---

### Task 9: FAQ page (/fragor-och-svar) with FAQPage schema

**Files:**
- Create: `apps/web/components/Faq/faq-items.tsx` (data moved from `pages/ansokan/AnsokanFaq.tsx`)
- Create: `apps/web/components/Faq/FaqAccordion.tsx` (accordion moved from `AnsokanFaq.tsx`)
- Create: `apps/web/pages/fragor-och-svar.tsx`
- Modify: `apps/web/pages/ansokan/AnsokanFaq.tsx` → becomes a thin re-export/wrapper (or update `pages/ansokan/index.tsx` to import the moved component and delete the old file)
- Test: `apps/web/pages/fragor-och-svar.spec.tsx`

**Interfaces:**
- Consumes: `Seo`, `Breadcrumbs`, `getRoute`.
- Produces:

```tsx
// components/Faq/faq-items.tsx
export interface FaqItem {
  icon: string
  question: string
  answer: ReactNode
  answerText: string // plain-text mirror of answer, for JSON-LD
}
export const FAQ_ITEMS: FaqItem[]

// components/Faq/FaqAccordion.tsx
const FaqAccordion: ({ items }: { items: FaqItem[] }) => ReactElement // default export
```

**Move mechanics:** `AnsokanFaq.tsx` currently holds both the `FAQ_ITEMS` array and the Skiper103 bouncy accordion. Split: data → `faq-items.tsx` (add `answerText` — for the one JSX answer, its plain-text equivalent: `'Nej, medlemskapet är för frilansare. Har du eller ditt företag ett konsultbehov kan du i stället tipsa om uppdraget — gratis och utan mellanhänder.'`), accordion component → `FaqAccordion.tsx` taking `items` as a prop. `pages/ansokan/index.tsx` renders `<FaqAccordion items={FAQ_ITEMS.slice(0, 3)} />` plus a link to `/fragor-och-svar`; the FAQ page renders all items.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/fragor-och-svar.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { FAQ_ITEMS } from '../components/Faq/faq-items'
import FragorOchSvar from './fragor-och-svar'

describe('/fragor-och-svar', () => {
  it('renders every FAQ question', () => {
    render(<FragorOchSvar />)
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
  })

  it('emits FAQPage JSON-LD with all questions', () => {
    const { container } = render(<FragorOchSvar />)
    const script = container.querySelector(
      'script[type="application/ld+json"]:last-of-type',
    )
    const data = JSON.parse(script!.textContent!)
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(FAQ_ITEMS.length)
    expect(data.mainEntity[0]['@type']).toBe('Question')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/fragor-och-svar.spec.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Perform the split and build the page.** Move code as described above (preserve the Skiper attribution comment with the accordion). The page:

```tsx
// apps/web/pages/fragor-och-svar.tsx
import Breadcrumbs from '../components/Breadcrumbs'
import { FAQ_ITEMS } from '../components/Faq/faq-items'
import FaqAccordion from '../components/Faq/FaqAccordion'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const FragorOchSvar = () => {
  const meta = getRoute('/fragor-och-svar')!
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answerText },
    })),
  }

  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Frågor och svar
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Vanliga frågor om communityt
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Här är svaren på det vi oftast får frågor om. Hittar du inte ditt
          svar? Fråga i Slacken — eller mejla oss via kontaktsidan.
        </p>
        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}

export default FragorOchSvar
```

For every item in the moved `FAQ_ITEMS`, `answerText` is the answer string itself (all but one answer are already plain strings — reuse them; only the JSX answer gets the hand-written mirror from the Move mechanics note).

- [ ] **Step 4: Run tests to verify they pass** — this spec plus the full suite (`bun run test`), confirming `/ansokan` still renders its trimmed FAQ.

- [ ] **Step 5: Verify in browser.** `/fragor-och-svar` shows the full bouncy accordion; `/ansokan` shows 3 items + a "Fler frågor och svar →" link (add it: `<Link href="/fragor-och-svar" className="underline hover:no-underline">Fler frågor och svar</Link>` under the accordion).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/Faq apps/web/pages/fragor-och-svar.tsx apps/web/pages/fragor-och-svar.spec.tsx apps/web/pages/ansokan
git commit -m "feat(web): FAQ page with FAQPage schema; share accordion with ansokan"
```

---

### Task 10: Hub pages — /for-frilansare, /for-foretag, /uppdrag, /anlita-frilansare

**Files:**
- Create: `apps/web/components/HubPage.tsx`
- Create: `apps/web/pages/for-frilansare.tsx`
- Create: `apps/web/pages/for-foretag.tsx`
- Create: `apps/web/pages/uppdrag/index.tsx`
- Create: `apps/web/pages/anlita-frilansare.tsx`
- Test: `apps/web/pages/hub-pages.spec.tsx`

**Interfaces:**
- Consumes: `Seo`, `Breadcrumbs`, `getRoute`.
- Produces:

```tsx
// components/HubPage.tsx — shared frame for hub/landing pages
export interface HubLink {
  href: string
  label: string
  text: string      // one-sentence teaser
  icon: string      // iconify class
  external?: boolean
}
interface HubPageProps {
  path: string          // registry path, drives Seo + Breadcrumbs
  eyebrow: string
  heading: string
  intro: ReactNode
  links: HubLink[]
  children?: ReactNode  // extra sections below the link cards
}
const HubPage: (props: HubPageProps) => ReactElement // default export
```

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/hub-pages.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import AnlitaFrilansare from './anlita-frilansare'
import ForForetag from './for-foretag'
import ForFrilansare from './for-frilansare'
import Uppdrag from './uppdrag/index'

describe('hub pages', () => {
  it('/for-frilansare links to its section pages', () => {
    render(<ForFrilansare />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    for (const href of ['/ansokan', '/sa-fungerar-det', '/fragor-och-svar']) {
      expect(
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  it('/for-foretag links to tipsa and anlita', () => {
    render(<ForForetag />)
    for (const href of ['/tipsa', '/anlita-frilansare']) {
      expect(
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  it('/uppdrag links to the portal and tipsa', () => {
    render(<Uppdrag />)
    expect(
      screen
        .getAllByRole('link')
        .some(
          (a) =>
            a.getAttribute('href') === 'https://uppdrag.frilansaresverige.se/',
        ),
    ).toBe(true)
    expect(
      screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/tipsa'),
    ).toBe(true)
  })

  it('/anlita-frilansare has a tipsa call to action', () => {
    render(<AnlitaFrilansare />)
    expect(
      screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/tipsa'),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/hub-pages.spec.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement `HubPage`**

```tsx
// apps/web/components/HubPage.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'
import { getRoute } from '../lib/routes'
import Breadcrumbs from './Breadcrumbs'
import Seo from './Seo'

export interface HubLink {
  href: string
  label: string
  text: string
  icon: string
  external?: boolean
}

interface HubPageProps {
  path: string
  eyebrow: string
  heading: string
  intro: ReactNode
  links: HubLink[]
  children?: ReactNode
}

const HubPage = ({
  path,
  eyebrow,
  heading,
  intro,
  links,
  children,
}: HubPageProps) => {
  const meta = getRoute(path)!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={path} />
      <Breadcrumbs path={path} />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display max-w-[16em] text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {heading}
        </h1>
        <div className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          {intro}
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {links.map((link) => {
            const card = (
              <span className="flex h-full flex-col rounded-3xl bg-brand-cream/5 p-7 transition-colors hover:bg-brand-cream/10">
                <span
                  aria-hidden="true"
                  className={`${link.icon} size-7 text-brand-coral`}
                />
                <span className="font-display mt-4 text-xl font-bold text-brand-cream">
                  {link.label}
                </span>
                <span className="mt-2 leading-[1.6] text-brand-cream/80">
                  {link.text}
                </span>
              </span>
            )
            return (
              <li key={link.href}>
                {link.external ? (
                  <a href={link.href} className="block h-full">
                    {card}
                  </a>
                ) : (
                  <Link href={link.href} className="block h-full">
                    {card}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        {children}
      </section>
    </>
  )
}

export default HubPage
```

- [ ] **Step 4: Implement the four pages** (final copy; icons verified in lucide):

```tsx
// apps/web/pages/for-frilansare.tsx
import HubPage from '../components/HubPage'

const ForFrilansare = () => (
  <HubPage
    path="/for-frilansare"
    eyebrow="För frilansare"
    heading="Frilansa — men aldrig ensam"
    intro={
      <p>
        Frilansare Sverige är ett gratis community där tusentals frilansare
        delar uppdrag, kunskap och kollegskap i Slack. Ingen medlemsavgift,
        inga mellanhänder — bara kollegor.
      </p>
    }
    links={[
      {
        href: '/ansokan',
        label: 'Bli medlem',
        text: 'Ansökan är gratis och tar ett par minuter. Vi ses i Slack!',
        icon: 'icon-[lucide--user-round]',
      },
      {
        href: '/sa-fungerar-det',
        label: 'Så fungerar det',
        text: 'Kanalerna, uppdragstipsen och reglerna — allt du behöver veta som ny.',
        icon: 'icon-[lucide--map]',
      },
      {
        href: '/fragor-och-svar',
        label: 'Frågor och svar',
        text: 'Vem kan bli medlem? Vad kostar det? Svaren på det vanligaste.',
        icon: 'icon-[lucide--message-circle-question-mark]',
      },
      {
        href: '/uppdrag',
        label: 'Hitta uppdrag',
        text: 'Uppdrag tipsade av medlemmar och företag — utan mellanhänder.',
        icon: 'icon-[lucide--briefcase-business]',
      },
    ]}
  />
)

export default ForFrilansare
```

```tsx
// apps/web/pages/for-foretag.tsx
import HubPage from '../components/HubPage'

const ForForetag = () => (
  <HubPage
    path="/for-foretag"
    eyebrow="För företag"
    heading="Nå tusentals frilansare — direkt"
    intro={
      <p>
        Söker du en konsult? I Frilansare Sverige når ditt uppdrag Sveriges
        största frilanscommunity på en gång. Det kostar ingenting, och
        frilansarna hör av sig direkt till dig — utan mellanhänder. Det
        gäller oavsett om du är arbetsgivare, konsultförmedlare eller
        konsultbolag.
      </p>
    }
    links={[
      {
        href: '/tipsa',
        label: 'Tipsa om uppdrag',
        text: 'Beskriv uppdraget så når det communityt direkt. Gratis.',
        icon: 'icon-[lucide--megaphone]',
      },
      {
        href: '/anlita-frilansare',
        label: 'Anlita en frilansare',
        text: 'Så hittar du rätt kompetens i communityt — och vad som gäller.',
        icon: 'icon-[lucide--handshake]',
      },
    ]}
  />
)

export default ForForetag
```

```tsx
// apps/web/pages/uppdrag/index.tsx
import Link from 'next/link'
import HubPage from '../../components/HubPage'

const Uppdrag = () => (
  <HubPage
    path="/uppdrag"
    eyebrow="Uppdrag"
    heading="Lediga frilans- och konsultuppdrag"
    intro={
      <p>
        Uppdragen i Frilansare Sverige kommer från medlemmar och företag som
        tipsar communityt direkt — utvecklare, designers, skribenter,
        projektledare och fler. Inga mellanhänder: du tar kontakt med
        uppdragsgivaren själv.
      </p>
    }
    links={[
      {
        href: 'https://uppdrag.frilansaresverige.se/',
        label: 'Öppna uppdragsportalen',
        text: 'Alla aktuella uppdrag från communityt, samlade på ett ställe.',
        icon: 'icon-[lucide--briefcase-business]',
        external: true,
      },
      {
        href: '/tipsa',
        label: 'Tipsa om ett uppdrag',
        text: 'Har du ett uppdrag som passar en frilansare? Tipsa gratis.',
        icon: 'icon-[lucide--megaphone]',
      },
    ]}
  >
    <p className="mt-10 max-w-[36em] leading-[1.6] text-brand-cream/70">
      Är du inte medlem än?{' '}
      <Link href="/ansokan" className="underline hover:no-underline">
        Ansök om medlemskap
      </Link>{' '}
      så får du uppdragstipsen direkt i Slack.
    </p>
  </HubPage>
)

export default Uppdrag
```

```tsx
// apps/web/pages/anlita-frilansare.tsx
import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const AnlitaFrilansare = () => {
  const meta = getRoute('/anlita-frilansare')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          För företag
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Anlita en frilansare ur communityt
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          I Frilansare Sverige finns frilansare i hela landet och i de flesta
          branscher: utveckling, design, copy, foto, projektledning, ekonomi
          och mer. Alla är etablerade — med eget bolag och minst en kund
          bakom sig.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Så går det till
        </h2>
        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 leading-[1.6] text-brand-cream/85">
          <li>
            <Link href="/tipsa" className="underline hover:no-underline">
              Tipsa om uppdraget
            </Link>{' '}
            — beskriv behovet, platsen och arvodet.
          </li>
          <li>
            Tipset publiceras till communityts tusentals medlemmar direkt i
            Slack.
          </li>
          <li>
            Intresserade frilansare kontaktar dig direkt. Ni gör upp om
            villkoren själva — vi tar ingen avgift och står inte som
            mellanhand.
          </li>
        </ol>
        <div className="mt-10">
          <Link
            href="/tipsa"
            className="inline-block rounded-full bg-brand-coral px-6 py-3 font-bold text-brand-grey"
          >
            Tipsa om ditt uppdrag
          </Link>
        </div>
      </section>
    </>
  )
}

export default AnlitaFrilansare
```

Before running tests, verify the three new icon names in this task (`map`, `message-circle-question-mark`, `megaphone`, `handshake`):

```bash
node -e "const i=require('@iconify-json/lucide/icons.json');for(const n of ['map','message-circle-question-mark','megaphone','handshake'])console.log(n,!!(i.icons[n]||i.aliases?.[n]))"
```

If any prints `false`, substitute: `message-circle-question-mark`→`circle-help`, `handshake`→`heart-handshake`, `map`→`compass`, `megaphone`→`send`.

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/hub-pages.spec.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Verify in browser** — all four pages render with breadcrumbs, cards and working links in both themes.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/HubPage.tsx apps/web/pages/for-frilansare.tsx apps/web/pages/for-foretag.tsx apps/web/pages/uppdrag apps/web/pages/anlita-frilansare.tsx apps/web/pages/hub-pages.spec.tsx
git commit -m "feat(web): audience hub pages and uppdrag landing"
```

---

### Task 11: Content pages — /sa-fungerar-det, /kunskap, /community, /om, /kontakt, /uppforandekod

**Files:**
- Create: `apps/web/pages/sa-fungerar-det.tsx`
- Create: `apps/web/pages/kunskap.tsx`
- Create: `apps/web/pages/community.tsx`
- Create: `apps/web/pages/om.tsx`
- Create: `apps/web/pages/kontakt.tsx`
- Create: `apps/web/pages/uppforandekod.tsx`
- Test: `apps/web/pages/content-pages.spec.tsx`

**Interfaces:**
- Consumes: `Seo`, `Breadcrumbs`, `getRoute`, `HubPage` (for /kunskap and /community).
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/content-pages.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import Community from './community'
import Kontakt from './kontakt'
import Kunskap from './kunskap'
import Om from './om'
import SaFungerarDet from './sa-fungerar-det'
import Uppforandekod from './uppforandekod'

const rendersH1 = (Page: () => ReturnType<typeof Community>, text: RegExp) => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text)
}

describe('content pages', () => {
  it('sa-fungerar-det', () => rendersH1(SaFungerarDet, /Så fungerar/))
  it('kunskap', () => rendersH1(Kunskap, /Kunskap/))
  it('community', () => rendersH1(Community, /communityt/i))
  it('om', () => rendersH1(Om, /Om Frilansare Sverige/))
  it('kontakt', () => rendersH1(Kontakt, /Kontakt/))
  it('uppforandekod', () => rendersH1(Uppforandekod, /Uppförandekod/))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/content-pages.spec.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the six pages.** All follow the same frame (`Seo` + `Breadcrumbs` + `<section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">` + eyebrow + h1), like `anlita-frilansare.tsx` in Task 10. Final copy per page:

**`sa-fungerar-det.tsx`** — eyebrow "Så fungerar det", h1 "Så fungerar communityt". Body (h2-sections with paragraphs):
1. *"Ansökan"* — "Du ansöker med några rader om vad du gör och en länk till din LinkedIn. Communityt är för dig som redan är igång som frilansare — med ett bolag att fakturera genom och minst en kund. Blir du godkänd får du en Slack-inbjudan via mejl." + link till `/ansokan`.
2. *"Slacken"* — "Allt händer i Slack: kanaler för branscher, städer och ämnen, trådar med frågor och svar, och direktmeddelanden när du vill ta något vidare. Presentera dig i välkomstkanalen så hittar du snabbt rätt."
3. *"Uppdragen"* — "Medlemmar och företag tipsar om uppdrag i #uppdrag och i uppdragsportalen. Intresserad? Ta kontakt direkt med uppdragsgivaren — communityt tar ingen avgift och står aldrig som mellanhand." + länkar till `/uppdrag` och `/tipsa`.
4. *"Reglerna"* — "Schysst ton, ingen spam, inga dolda säljintressen. Detaljerna finns i uppförandekoden." + link till `/uppforandekod`.

**`kunskap.tsx`** — use `HubPage` with `path="/kunskap"`, eyebrow "Kunskap", heading "Kunskap för frilansare", intro: "Guider och verktyg för dig som frilansar i Sverige — skrivna av communityt, utan säljagenda. Vi bygger ut den här sektionen löpande; först ut är svaren på de vanligaste frågorna." Links: `{ href: '/fragor-och-svar', label: 'Frågor och svar', text: 'Det vanligaste om medlemskap och community.', icon: 'icon-[lucide--message-circle-question-mark]' }` (same icon fallback rule as Task 10). Children: a paragraph "Vill du skriva en guide eller föreslå ett ämne? Säg till i Slacken eller öppna ett ärende på GitHub — sajten är öppen källkod." with the GitHub link `https://github.com/frilansaresverige/frilansaresverige.se/`.

**`community.tsx`** — use `HubPage` with `path="/community"`, eyebrow "Community", heading "Communityt bakom sajten", intro: "Frilansare Sverige drivs av sina medlemmar — ideellt, gratis och med öppen källkod. Här hittar du vilka vi är, vad som gäller och hur du når oss." Links: `/om` ("Om oss", "Varför communityt finns och hur det drivs.", `icon-[lucide--heart-handshake]`), `/uppforandekod` ("Uppförandekod", "Reglerna som håller Slacken schysst.", `icon-[lucide--scale]`), `/kontakt` ("Kontakt", "Frågor om medlemskap, press eller sajten.", `icon-[lucide--mail]`).

**`om.tsx`** — eyebrow "Om oss", h1 "Om Frilansare Sverige". Body:
1. Intro: "Frilansare Sverige är Sveriges största community för frilansare. Vi främjar kontaktskapande och uppdragstipsande mellan frilansare — helt gratis, utan mellanhänder."
2. h2 *"Därför finns vi"*: "Att frilansa är friare än en anställning — men också ensammare. Communityt ger det en arbetsplats annars ger: kollegor att bolla med, tips när någon är fullbokad och svar på frågorna som annars kostar dyra konsulttimmar."
3. h2 *"Öppen källkod"*: "Sajten byggs av communityt och koden är öppen. Bidra gärna!" + GitHub-länk (`https://github.com/frilansaresverige/frilansaresverige.se/`).
4. Avsluta med CTA-länk till `/ansokan`.

**`kontakt.tsx`** — eyebrow "Kontakt", h1 "Kontakta oss". Body: "Snabbast svar får du i Slacken om du är medlem. Annars når du oss så här:" + a list: "Frågor om medlemskap och ansökan — se först" + link `/fragor-och-svar`; "Uppdrag och konsultbehov —" + link `/tipsa`; "Press, samarbeten och övrigt — öppna ett ärende på GitHub" + GitHub-länk. **Do not invent an email address** — the site has none published; if the user wants one shown, they add it later.

**`uppforandekod.tsx`** — eyebrow "Community", h1 "Uppförandekod". Body (h2 + list per section):
1. *"Var schysst"* — "Vi är kollegor, inte konkurrenter. Hård kritik mot idéer är okej; påhopp på personer är det inte. Trakasserier och diskriminering leder till uteslutning."
2. *"Ingen spam"* — "Dela gärna det du gör, men communityt är inte en säljkanal. Massutskick, oombedd reklam och dolda affärsintressen hör inte hemma här."
3. *"Uppdragstips är gratis och direkta"* — "Tipsa bara om uppdrag du själv står bakom, med ärliga villkor och en riktig kontaktperson. Inga mellanhänder som säljer vidare communityts tips."
4. *"Säg till"* — "Ser du något som bryter mot koden? Säg till en administratör i Slacken." (No invented enforcement bureaucracy beyond this.)

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/content-pages.spec.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Verify in browser** — all six pages render with breadcrumbs and correct copy; nav tab targets now all resolve (no 404s from the SiteNav panels).

- [ ] **Step 6: Commit**

```bash
git add apps/web/pages/sa-fungerar-det.tsx apps/web/pages/kunskap.tsx apps/web/pages/community.tsx apps/web/pages/om.tsx apps/web/pages/kontakt.tsx apps/web/pages/uppforandekod.tsx apps/web/pages/content-pages.spec.tsx
git commit -m "feat(web): community, om, kontakt, kunskap and how-it-works pages"
```

---

### Task 12: Legal pages — /integritetspolicy, /cookies, /villkor

**Files:**
- Create: `apps/web/pages/integritetspolicy.tsx`
- Create: `apps/web/pages/cookies.tsx`
- Create: `apps/web/pages/villkor.tsx`
- Test: `apps/web/pages/legal-pages.spec.tsx`

**Interfaces:** consumes `Seo`, `Breadcrumbs`, `getRoute`; produces nothing downstream.

**Content ground rules:** describe only what the site actually does — the ansökan form (name/mail/LinkedIn → Slack invitation), the tipsa form (uppdragsuppgifter → publicerade till communityt), theme/cookie-consent state in the browser (`next-themes` + CookieToast use local storage). No analytics claims unless the repo shows an analytics integration (check `_app.tsx`/`_document.tsx` before writing; as of this plan there is none). Mark each page with "Senast uppdaterad: 2026-08-25". These pages are drafts for the user to review legally — say so in the task's completion report, not on the pages themselves.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/pages/legal-pages.spec.tsx
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import Cookies from './cookies'
import Integritetspolicy from './integritetspolicy'
import Villkor from './villkor'

describe('legal pages', () => {
  it('integritetspolicy renders and mentions the two forms', () => {
    render(<Integritetspolicy />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Integritetspolicy',
    )
    expect(screen.getByText(/ansökan/i)).toBeInTheDocument()
  })
  it('cookies page renders', () => {
    render(<Cookies />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Cookies',
    )
  })
  it('villkor renders', () => {
    render(<Villkor />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Villkor',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test --preload ../../test-setup.ts pages/legal-pages.spec.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement.** Same page frame as Task 11. Content outline (final headings; flesh paragraphs from the ground rules above, staying strictly factual):

- **integritetspolicy.tsx**: h1 "Integritetspolicy". Sections: "Vilka uppgifter vi samlar in" (ansökan: namn, mejl, LinkedIn, beskrivning; tipsa: uppdrags- och kontaktuppgifter du själv anger), "Vad uppgifterna används till" (ansökan → bedömning + Slack-inbjudan; tips → publicering till communityt), "Var uppgifterna hanteras" (Slack som plattform), "Dina rättigheter" (begär utdrag eller radering via kontaktsidan, link `/kontakt`), "Senast uppdaterad: 2026-08-25".
- **cookies.tsx**: h1 "Cookies och lokal lagring". Sections: "Så använder vi lagring i webbläsaren" (temaval och cookie-besked sparas lokalt i din webbläsare; ingen spårning mellan sajter), "Tredjepartscookies" (inga), "Senast uppdaterad: 2026-08-25".
- **villkor.tsx**: h1 "Villkor". Sections: "Medlemskap" (gratis; för aktiva frilansare; kan avslutas vid brott mot uppförandekoden, link `/uppforandekod`), "Uppdragstips" (publiceras som de skickas in; communityt är ingen part i avtal mellan frilansare och uppdragsgivare och tar inget ansvar för uppdragens innehåll), "Sajten" (tillhandahålls i befintligt skick, öppen källkod), "Senast uppdaterad: 2026-08-25".

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test --preload ../../test-setup.ts pages/legal-pages.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/pages/integritetspolicy.tsx apps/web/pages/cookies.tsx apps/web/pages/villkor.tsx apps/web/pages/legal-pages.spec.tsx
git commit -m "feat(web): legal pages (integritetspolicy, cookies, villkor)"
```

---

### Task 13: Full verification

**Files:** none created; fixes only if checks fail.

- [ ] **Step 1: Run the whole test suite** from `apps/web/`: `bun run test` — expected all green.

- [ ] **Step 2: Typecheck**: `cd apps/web && bunx tsc --noEmit` — expected clean.

- [ ] **Step 3: Production build**: from repo root `bun run build` (or `cd apps/web && bun run build`) — expected success; note `pages/404.tsx`/`500.tsx` listed as static.

- [ ] **Step 4: Crawl the registry.** With dev (or `next start`) running:

```bash
cd apps/web && node -e "
const { ROUTES } = require('./lib/routes.ts');
" 2>/dev/null || true
# Node can't require TS — use bun instead:
bun -e "
import { ROUTES } from './lib/routes'
for (const r of ROUTES) {
  const res = await fetch('http://localhost:3000' + r.path)
  console.log(res.status, r.path)
  if (res.status !== 200) process.exitCode = 1
}
"
```

Expected: `200` for every route.

- [ ] **Step 5: SEO spot checks.** `curl -s localhost:3000/fragor-och-svar | grep -c 'application/ld+json'` ≥ 2 (breadcrumbs + FAQPage); `curl -s localhost:3000/tipsa/tack | grep 'noindex'` matches; `curl -s localhost:3000/sitemap.xml | grep -c '<url>'` equals the count of indexable routes.

- [ ] **Step 6: Commit any fixes** and report results (including the note that legal-page copy awaits the user's review).

---

## Follow-up plans (out of this plan's scope, per spec build order)

1. **Kunskap content engine** — /guider pillar pages + clusters, /jamfor/egenanstallningsforetag, /kalkylatorer (needs its own spec session for content sourcing and calculator logic).
2. **Growth pages** — /ordlista, /blogg (+RSS), /event, /roster, /frilansrapporten, /medlemsformaner, /uppdrag/[slug] city/skill pages.
