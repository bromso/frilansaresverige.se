import type { GetServerSideProps } from 'next'
import { SITE_URL } from '../components/Seo'
import { buildLlmsTxt } from '../lib/llms'

// Served as a page route for the same reason as sitemap.xml: the content
// derives from lib/routes.ts, so generating it at request time keeps it
// in lockstep with the registry instead of going stale in public/.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate',
  )
  res.write(buildLlmsTxt(SITE_URL))
  res.end()
  return { props: {} }
}

const LlmsTxt = () => null
export default LlmsTxt
