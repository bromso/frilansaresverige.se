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
  type PostMeta,
  parseEventMeta,
  parsePostMeta,
  sortPosts,
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
