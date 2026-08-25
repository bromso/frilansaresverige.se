import type { GetServerSideProps } from 'next'
import { SITE_URL } from '../components/Seo'
import { buildSitemapXml } from '../lib/sitemap'

// The registry is static, so the XML is too — but a real page route (not
// a build artifact in public/) keeps it in lockstep with lib/routes.ts.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate',
  )
  res.write(buildSitemapXml(SITE_URL))
  res.end()
  return { props: {} }
}

const Sitemap = () => null
export default Sitemap
