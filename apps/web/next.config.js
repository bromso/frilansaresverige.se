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
  transpilePackages: ['@frilansaresverige/ui'],
  reactStrictMode: true,
}

module.exports = nextConfig
