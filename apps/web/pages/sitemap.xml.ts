import type { GetServerSideProps } from 'next'
import { SITE_URL } from '../components/Seo'
import {
  getAllEvents,
  getAllGigs,
  getAllPosts,
  getAllReviews,
} from '../lib/content.server'
import { buildSitemapXml } from '../lib/sitemap'

// The registry is static, so the XML is too — but a real page route (not
// a build artifact in public/) keeps it in lockstep with lib/routes.ts.
// The content reads at request time need content/ traced into the
// standalone bundle — see outputFileTracingIncludes in next.config.js.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=604800',
  )
  const extras = [
    ...getAllPosts().map((post) => ({
      path: `/nyheter/${post.slug}`,
      lastmod: post.date,
    })),
    ...getAllEvents().map((event) => ({
      path: `/event/${event.slug}`,
      lastmod: event.startDate,
    })),
    ...getAllGigs().map((gig) => ({
      path: `/uppdrag/${gig.slug}`,
      lastmod: gig.date,
    })),
    ...getAllReviews().map((review) => ({
      path: `/recensioner/${review.slug}`,
      lastmod: review.date,
    })),
  ]
  res.write(buildSitemapXml(SITE_URL, extras))
  res.end()
  return { props: {} }
}

const Sitemap = () => null
export default Sitemap
