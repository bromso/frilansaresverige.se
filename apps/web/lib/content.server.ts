// Filesystem loaders for the MDX content in apps/web/content/. Split
// from lib/content.ts because this file imports node:fs — pages may only
// reference it from getStaticProps/getStaticPaths (which Next strips
// from the client bundle); everything a component renders with lives in
// the fs-free lib/content.ts.
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { load as loadYaml } from 'js-yaml'
import {
  type EventMeta,
  type GigMeta,
  type PostMeta,
  parseEventMeta,
  parseGigMeta,
  parsePostMeta,
  parseReviewMeta,
  parseSidaMeta,
  type ReviewMeta,
  type SidaMeta,
  type SidaSection,
  sortPosts,
  splitSections,
} from './content'

const CONTENT_DIR = path.join(process.cwd(), 'content')

const listSlugs = (section: string): string[] =>
  fs
    .readdirSync(path.join(CONTENT_DIR, section))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort()

// The repo pins js-yaml to v4 (root package.json overrides), whose API
// dropped the safeLoad function gray-matter's built-in engine calls —
// so hand gray-matter a v4 engine explicitly.
const MATTER_OPTIONS = {
  engines: {
    yaml: (source: string) => loadYaml(source) as Record<string, unknown>,
  },
}

const readEntry = (section: string, slug: string) =>
  matter(
    fs.readFileSync(path.join(CONTENT_DIR, section, `${slug}.mdx`), 'utf8'),
    MATTER_OPTIONS,
  )

export const getPostSlugs = (): string[] => listSlugs('nyheter')
export const getEventSlugs = (): string[] => listSlugs('event')
export const getGigSlugs = (): string[] => listSlugs('uppdrag')
export const getReviewSlugs = (): string[] => listSlugs('recensioner')

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

export const getAllGigs = (): GigMeta[] =>
  sortPosts(
    getGigSlugs().map((slug) =>
      parseGigMeta(slug, readEntry('uppdrag', slug).data),
    ),
  )

export const getGig = (slug: string): { meta: GigMeta; content: string } => {
  const { data, content } = readEntry('uppdrag', slug)
  return { meta: parseGigMeta(slug, data), content }
}

// Best score first — a ranking, unlike the date-ordered sections.
export const getAllReviews = (): ReviewMeta[] =>
  getReviewSlugs()
    .map((slug) => parseReviewMeta(slug, readEntry('recensioner', slug).data))
    .sort(
      (a, b) => b.overall - a.overall || a.title.localeCompare(b.title, 'sv'),
    )

export const getReview = (
  slug: string,
): { meta: ReviewMeta; content: string } => {
  const { data, content } = readEntry('recensioner', slug)
  return { meta: parseReviewMeta(slug, data), content }
}

export const getSida = (
  slug: string,
): { meta: SidaMeta; sections: SidaSection[] } => {
  const { data, content } = readEntry('sidor', slug)
  return { meta: parseSidaMeta(slug, data), sections: splitSections(content) }
}

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
