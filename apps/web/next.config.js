/** @type {import('next').NextConfig} */
const path = require('node:path')

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@frilansaresverige/ui'],
  reactStrictMode: true,
}

module.exports = nextConfig
