/** @type {import('next').NextConfig} */
const path = require('node:path')

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // The sitemap reads content/ with fs at request time, which the
  // standalone output's static analysis can't see — trace it explicitly.
  outputFileTracingIncludes: {
    '/sitemap.xml': ['./content/**/*'],
  },
  // Files under public/ ship with max-age=0 by default, so every visit
  // re-downloads the covers and avatars. They aren't content-hashed, so
  // no immutable-year: a month with a long stale-while-revalidate —
  // replace an image under a new filename if it must change instantly.
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=31536000',
          },
        ],
      },
      {
        source: '/:file(favicon\\.ico|site\\.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
    ]
  },
  transpilePackages: ['@frilansaresverige/ui'],
  reactStrictMode: true,
}

module.exports = nextConfig
