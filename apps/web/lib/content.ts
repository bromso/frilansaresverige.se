// Loads the MDX content that drives /nyheter and /event. Files live in
// apps/web/content/<section>/<slug>.mdx with YAML frontmatter. This
// module is fs-free (types, parsing, sorting, formatting) so components
// can import it; the filesystem loaders live in lib/content.server.ts.

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

// Fixed role set: drives both frontmatter validation and the archive's
// filter chips, so a typo'd role fails the content test instead of
// silently rendering an unfilterable listing.
export const GIG_ROLES = [
  'Utveckling',
  'Design',
  'Innehåll',
  'Projektledning',
] as const

export type GigRole = (typeof GIG_ROLES)[number]

export interface GigMeta {
  slug: string
  title: string
  excerpt: string
  /** "YYYY-MM-DD" — the day the tip was published */
  date: string
  role: GigRole
  city: string
  scope: string
  client?: string
  applyUrl?: string
}

// Review categories and criteria are fixed sets for the same reason as
// GIG_ROLES: they drive filter chips and score panels, so a typo fails
// the content test instead of rendering a broken UI.
export const REVIEW_CATEGORIES = [
  'Konsultmäklare',
  'Rekrytering',
  'HR-tjänster',
] as const

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number]

export const REVIEW_CRITERIA = [
  { key: 'villkor', label: 'Villkor' },
  { key: 'transparens', label: 'Transparens' },
  { key: 'bemotande', label: 'Bemötande' },
] as const

export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number]['key']

export type ReviewScores = Record<ReviewCriterion, number>

export interface ReviewMeta {
  slug: string
  /** Company name */
  title: string
  /** One-line verdict */
  excerpt: string
  /** "YYYY-MM-DD" — when the review was published */
  date: string
  category: ReviewCategory
  website?: string
  /** Path under public/ to the company's logo mark. */
  logo?: string
  scores: ReviewScores
  /** Average of the criteria, one decimal — computed, never authored. */
  overall: number
}

// Static "sidor" (legal pages, uppförandekoden): MDX documents whose h2
// headings become scrollspy sections in SectionedPage.
export interface SidaMeta {
  slug: string
  heading: string
  eyebrow: string
  intro?: string
  /** "YYYY-MM-DD" — shown as "Senast uppdaterad". */
  updated?: string
}

export interface SidaSection {
  id: string
  title: string
  body: string
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/

/** Parses "YYYY-MM-DD[THH:mm]" as local time (avoids the UTC shift that
 * `new Date("YYYY-MM-DD")` causes on machines west of UTC). */
export const parseLocalDate = (value: string): Date => {
  const m = value.match(DATE_PATTERN)
  if (!m) {
    throw new Error(
      `Ogiltigt datum "${value}". Använd "YYYY-MM-DD" eller "YYYY-MM-DDTHH:mm"`,
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

export const parseGigMeta = (
  slug: string,
  data: Record<string, unknown>,
): GigMeta => {
  const role = field(data, 'role', slug, true) as string
  if (!(GIG_ROLES as readonly string[]).includes(role)) {
    throw new Error(
      `${slug}: okänd roll "${role}". Använd ${GIG_ROLES.join(', ')}`,
    )
  }
  return {
    slug,
    title: field(data, 'title', slug, true) as string,
    excerpt: field(data, 'excerpt', slug, true) as string,
    date: dateField(data, 'date', slug, true) as string,
    role: role as GigRole,
    city: field(data, 'city', slug, true) as string,
    scope: field(data, 'scope', slug, true) as string,
    ...optionalFields(data, slug, ['client', 'applyUrl']),
  }
}

const scoreField = (
  scores: Record<string, unknown>,
  key: string,
  slug: string,
): number => {
  const value = scores[key]
  if (typeof value !== 'number') {
    throw new Error(`${slug}: scores saknar "${key}" (tal 1–5)`)
  }
  if (value < 1 || value > 5 || (value * 2) % 1 !== 0) {
    throw new Error(
      `${slug}: "${key}" måste vara 1–5 i halva steg, fick ${value}`,
    )
  }
  return value
}

export const parseReviewMeta = (
  slug: string,
  data: Record<string, unknown>,
): ReviewMeta => {
  const category = field(data, 'category', slug, true) as string
  if (!(REVIEW_CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(
      `${slug}: okänd kategori "${category}". Använd ${REVIEW_CATEGORIES.join(', ')}`,
    )
  }
  const rawScores = data.scores
  if (typeof rawScores !== 'object' || rawScores === null) {
    throw new Error(`${slug}: frontmatter saknar "scores"`)
  }
  const scores = Object.fromEntries(
    REVIEW_CRITERIA.map(({ key }) => [
      key,
      scoreField(rawScores as Record<string, unknown>, key, slug),
    ]),
  ) as ReviewScores
  const values = Object.values(scores)
  const overall =
    Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) /
    10
  return {
    slug,
    title: field(data, 'title', slug, true) as string,
    excerpt: field(data, 'excerpt', slug, true) as string,
    date: dateField(data, 'date', slug, true) as string,
    category: category as ReviewCategory,
    ...optionalFields(data, slug, ['website', 'logo']),
    scores,
    overall,
  }
}

export const parseSidaMeta = (
  slug: string,
  data: Record<string, unknown>,
): SidaMeta => ({
  slug,
  heading: field(data, 'heading', slug, true) as string,
  eyebrow: field(data, 'eyebrow', slug, true) as string,
  ...optionalFields(data, slug, ['intro']),
  ...(dateField(data, 'updated', slug, false) && {
    updated: dateField(data, 'updated', slug, false),
  }),
})

export const slugifyHeading = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Splits markdown into scrollspy sections on `## ` headings; anything
 * before the first heading is dropped (intros live in frontmatter). */
export const splitSections = (markdown: string): SidaSection[] => {
  const sections: SidaSection[] = []
  let current: SidaSection | null = null
  const lines: string[] = []
  const flush = () => {
    if (current) {
      sections.push({ ...current, body: lines.join('\n').trim() })
      lines.length = 0
    }
  }
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (.+)$/)
    if (heading) {
      flush()
      const title = heading[1].trim()
      current = { id: slugifyHeading(title), title, body: '' }
    } else if (current) {
      lines.push(line)
    }
  }
  flush()
  return sections
}

/** "4.3" → "4,3" — always one decimal, Swedish comma. */
export const formatScore = (score: number): string =>
  score.toFixed(1).replace('.', ',')

export const sortPosts = <T extends { date: string; slug: string }>(
  posts: T[],
): T[] =>
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
