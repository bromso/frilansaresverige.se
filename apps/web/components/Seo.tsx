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
