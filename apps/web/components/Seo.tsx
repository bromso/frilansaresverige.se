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
  /** Absolute path under public/ to a page-specific card. */
  image?: string
  /** What the card shows; defaults to the site name. */
  imageAlt?: string
  /** og:type — articles (news posts) say so, everything else is a website. */
  type?: 'website' | 'article'
  /** ISO date for article:published_time; only used with type="article". */
  publishedTime?: string
}

// Pure tag builder so the title/canonical/robots logic is unit-testable —
// next/head children never mount into happy-dom's <head>.
export const buildSeoTags = ({
  title,
  description,
  path,
  noindex,
  image,
  imageAlt,
}: SeoProps) => ({
  title: path === '/' ? `${SITE_NAME} – ${title}` : `${title} – ${SITE_NAME}`,
  description,
  // A canonical on a noindex page sends mixed signals (index this URL /
  // don't index this URL); error and thank-you pages get neither.
  canonical: noindex ? null : `${SITE_URL}${path}`,
  robots: noindex ? 'noindex,nofollow' : null,
  image: `${SITE_URL}${image ?? DEFAULT_OG_IMAGE}`,
  imageAlt: imageAlt ?? SITE_NAME,
  // Only the default card has known dimensions; covers vary.
  imageSize: image ? null : { width: '1200', height: '630' },
})

const Seo = (props: SeoProps) => {
  const tags = buildSeoTags(props)
  const type = props.type ?? 'website'
  return (
    <Head>
      <title>{tags.title}</title>
      <meta name="description" content={tags.description} />
      {tags.canonical && <link rel="canonical" href={tags.canonical} />}
      {tags.robots && <meta name="robots" content={tags.robots} />}
      <meta property="og:title" content={tags.title} />
      <meta property="og:description" content={tags.description} />
      {tags.canonical && <meta property="og:url" content={tags.canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:image" content={tags.image} />
      {tags.imageSize && (
        <meta property="og:image:width" content={tags.imageSize.width} />
      )}
      {tags.imageSize && (
        <meta property="og:image:height" content={tags.imageSize.height} />
      )}
      <meta property="og:image:alt" content={tags.imageAlt} />
      {type === 'article' && props.publishedTime && (
        <meta property="article:published_time" content={props.publishedTime} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tags.title} />
      <meta name="twitter:description" content={tags.description} />
      <meta name="twitter:image" content={tags.image} />
      <meta name="twitter:image:alt" content={tags.imageAlt} />
    </Head>
  )
}

export default Seo
