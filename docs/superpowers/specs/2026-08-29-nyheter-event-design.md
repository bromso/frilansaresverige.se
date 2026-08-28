# Nyheter (blog) + Event sections — design

Date: 2026-08-29
Status: approved

## Goal

Add an Apple Newsroom-style news/blog section and an events section to
frilansaresverige.se, authored in MDX, fully statically generated, and
integrated into the site's existing information architecture (routes.ts,
sitemap, breadcrumbs, SEO).

Reference designs: apple.com/newsroom (archive tiles + featured card) and
its article pages (centered narrow column, category eyebrow, standfirst),
translated into the site's existing brand (brand-blue background,
brand-cream text, brand-coral accents, Bricolage display font,
rounded-3xl cards).

## Decisions

- Blog lives at `/nyheter`, events at `/event` (single event:
  `/nyheter/[slug]`, `/event/[slug]`).
- Both sections are authored as MDX files with YAML frontmatter.
- Nav: both appear as items under the existing **Community** nav tab.
- Sample content: 6 Swedish posts, 4 events (2 upcoming, 2 past).

## Content pipeline

`next-mdx-remote` + `gray-matter` (two new deps in apps/web, no
next.config changes):

- Content in `apps/web/content/nyheter/*.mdx` and
  `apps/web/content/event/*.mdx`; filename is the slug.
- `apps/web/lib/content.ts` reads the directories with `fs` (server-side
  only, from `getStaticProps`/`getStaticPaths`), parses frontmatter with
  gray-matter, validates required fields, and sorts (posts: newest
  first; events: split into upcoming ascending / past descending by
  `startDate`).
- Single pages serialize the body with `next-mdx-remote/serialize` in
  `getStaticProps` and render with `<MDXRemote>` plus a styled component
  map.

### Frontmatter

Post (`content/nyheter/*.mdx`):

```yaml
title: string          # headline
excerpt: string        # standfirst / meta description
date: YYYY-MM-DD
category: string       # eyebrow, e.g. Nyhet | Uppdatering | Community
image: string?         # optional /images/... override for the cover
```

Event (`content/event/*.mdx`) adds:

```yaml
startDate: YYYY-MM-DDTHH:mm   # local Swedish time
endDate: YYYY-MM-DDTHH:mm?
location: string              # venue
city: string
rsvpUrl: string?
price: string?                # e.g. "Gratis"
```

(Events reuse `title`/`excerpt`/`image`; `category` defaults to "Event".)

## Pages

- `pages/nyheter/index.tsx` — archive. Hero heading, latest post as a
  large featured card, then a responsive 2–3 column tile grid: cover on
  top, coral category eyebrow, display-font title, Swedish date.
- `pages/nyheter/[slug].tsx` — article. Centered ~65ch column: eyebrow +
  date, extrabold headline, excerpt as standfirst, cover, MDX prose via
  `MdxContent` component map, then a "Fler nyheter" strip of up to 3
  other posts.
- `pages/event/index.tsx` — archive split into "Kommande event"
  (calendar-style date badge, title, city, time) and a quieter
  "Tidigare event" list.
- `pages/event/[slug].tsx` — event detail: headline, info panel card
  (date, time, place, price, coral "Anmäl dig" button when `rsvpUrl` is
  set; past events show "Det här eventet har ägt rum" instead), MDX body.

## Covers

No stock photography. Each post/event gets a deterministic
brand-gradient cover (hue derived from slug, coral/cream on blue,
matching the site's warm palette); `image` frontmatter overrides it
when a real asset exists. Rendered as a component, no binary assets.

## Site integration

- `lib/routes.ts`: add `/nyheter` and `/event` RouteMeta entries; add
  both as items under the Community NAV_TAB. Legal/footer untouched.
- Breadcrumbs: dynamic pages pass their own leaf crumb on top of the
  section crumb from routes.ts.
- `lib/sitemap.ts` + `pages/sitemap.xml.ts`: extended to append
  `/nyheter/<slug>` and `/event/<slug>` URLs from lib/content.ts.
- SEO: existing `Seo` component fed from frontmatter. JSON-LD via the
  existing StructuredData/schema-dts setup: `NewsArticle` for posts,
  `Event` (with location/offers) for events.
- Dates formatted with `Intl.DateTimeFormat('sv-SE')`; no date library.

## Testing

`bun test` specs following the existing `*.spec.ts` pattern:

- `lib/content.spec.ts` — frontmatter parsing/validation, post sorting,
  upcoming/past event split, slug listing.
- `lib/sitemap.spec.ts` — extended for dynamic URLs.
- Component smoke tests only where the existing suite has precedent.

## Out of scope

- CMS, RSS feed, pagination, tags/filtering, comments, search.
- Real cover imagery and per-post OG images (frontmatter hook exists).
