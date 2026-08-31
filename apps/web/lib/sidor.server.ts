// getStaticProps helper for the SectionedPage documents in content/sidor:
// loads the MDX, splits it into scrollspy sections and serializes each
// body. Server-only (fs via content.server).
import { serialize } from 'next-mdx-remote/serialize'
import type { SerializedSection } from '../components/SectionedPage'
import type { SidaMeta } from './content'
import { getSida } from './content.server'

export const loadSida = async (
  slug: string,
): Promise<{ meta: SidaMeta; sections: SerializedSection[] }> => {
  const { meta, sections } = getSida(slug)
  return {
    meta,
    sections: await Promise.all(
      sections.map(async ({ id, title, body }) => ({
        id,
        title,
        source: await serialize(body),
      })),
    ),
  }
}
