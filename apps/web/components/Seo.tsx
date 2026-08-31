import Head from 'next/head'

export const SITE_NAME = 'Frilansare Sverige'
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://frilansaresverige.se'

// The default social card (1200×630) used when a page doesn't bring its
// own image.
export const DEFAULT_OG_IMAGE = '/images/og-default.png'

export interface SeoProps {
  title: string
  description: string
  path: string
  noindex?: boolean
  /** Absolute path under public/ to a page-specific 1200×630 card. */
  image?: string
  /** og:type — articles (news posts) say so, everything else is a website. */
  type?: 'website' | 'article'
}

// Pure tag builder so the title/canonical/robots logic is unit-testable —
// next/head children never mount into happy-dom's <head>.
export const buildSeoTags = ({
  title,
  description,
  path,
  noindex,
  image = DEFAULT_OG_IMAGE,
}: SeoProps) => ({
  title: path === '/' ? `${SITE_NAME} – ${title}` : `${title} – ${SITE_NAME}`,
  description,
  canonical: `${SITE_URL}${path}`,
  robots: noindex ? 'noindex,nofollow' : null,
  image: `${SITE_URL}${image}`,
})

const Seo = (props: SeoProps) => {
  const tags = buildSeoTags(props)
  const type = props.type ?? 'website'
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
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:image" content={tags.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tags.title} />
      <meta name="twitter:description" content={tags.description} />
      <meta name="twitter:image" content={tags.image} />
    </Head>
  )
}

export default Seo
