import type { GetServerSideProps } from 'next'
import { SITE_URL } from '../components/Seo'
import { getEventSlugs, getGigSlugs, getPostSlugs } from '../lib/content.server'
import { buildSitemapXml } from '../lib/sitemap'

// The registry is static, so the XML is too — but a real page route (not
// a build artifact in public/) keeps it in lockstep with lib/routes.ts.
// The content reads at request time need content/ traced into the
// standalone bundle — see outputFileTracingIncludes in next.config.js.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate',
  )
  const extras = [
    ...getPostSlugs().map((slug) => `/nyheter/${slug}`),
    ...getEventSlugs().map((slug) => `/event/${slug}`),
    ...getGigSlugs().map((slug) => `/uppdrag/${slug}`),
  ]
  res.write(buildSitemapXml(SITE_URL, extras))
  res.end()
  return { props: {} }
}

const Sitemap = () => null
export default Sitemap
