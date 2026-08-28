// Loads the MDX content that drives /nyheter and /event. Files live in
// apps/web/content/<section>/<slug>.mdx with YAML frontmatter; this
// module reads the filesystem, so only call it from getStaticProps /
// getStaticPaths (or the sitemap's getServerSideProps).
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
  // js-yaml turns unquoted dates into Date objects parsed as UTC, which
  // silently shifts event times — force authors to quote them instead.
  if (value instanceof Date) {
    throw new Error(`${slug}: citera datumet i "${key}" (t.ex. "2026-08-29")`)
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `${slug}: frontmatter "${key}" måste vara en icke-tom sträng`,
    )
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

const optionalFields = (
  data: Record<string, unknown>,
  slug: string,
  keys: string[],
): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const key of keys) {
    const value = field(data, key, slug, false)
    if (value !== undefined) result[key] = value
  }
  return result
}

export const parsePostMeta = (
  slug: string,
  data: Record<string, unknown>,
): PostMeta => ({
  slug,
  title: field(data, 'title', slug, true) as string,
  excerpt: field(data, 'excerpt', slug, true) as string,
  date: dateField(data, 'date', slug, true) as string,
  category: field(data, 'category', slug, true) as string,
  ...optionalFields(data, slug, ['image']),
})

export const parseEventMeta = (
  slug: string,
  data: Record<string, unknown>,
): EventMeta => {
  const endDate = dateField(data, 'endDate', slug, false)
  return {
    slug,
    title: field(data, 'title', slug, true) as string,
    excerpt: field(data, 'excerpt', slug, true) as string,
    startDate: dateField(data, 'startDate', slug, true) as string,
    ...(endDate !== undefined && { endDate }),
    location: field(data, 'location', slug, true) as string,
    city: field(data, 'city', slug, true) as string,
    ...optionalFields(data, slug, ['rsvpUrl', 'price', 'image']),
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

const readEntry = (section: string, slug: string) =>
  matter(
    fs.readFileSync(path.join(CONTENT_DIR, section, `${slug}.mdx`), 'utf8'),
  )

export const getPostSlugs = (): string[] => listSlugs('nyheter')
export const getEventSlugs = (): string[] => listSlugs('event')

export const getAllPosts = (): PostMeta[] =>
  sortPosts(
    getPostSlugs().map((slug) =>
      parsePostMeta(slug, readEntry('nyheter', slug).data),
    ),
  )

export const getAllEvents = (): EventMeta[] =>
  getEventSlugs().map((slug) =>
    parseEventMeta(slug, readEntry('event', slug).data),
  )

export const getPost = (slug: string): { meta: PostMeta; content: string } => {
  const { data, content } = readEntry('nyheter', slug)
  return { meta: parsePostMeta(slug, data), content }
}

export const getEvent = (
  slug: string,
): { meta: EventMeta; content: string } => {
  const { data, content } = readEntry('event', slug)
  return { meta: parseEventMeta(slug, data), content }
}
