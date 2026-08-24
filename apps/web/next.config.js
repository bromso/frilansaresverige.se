/** @type {import('next').NextConfig} */
const path = require('node:path')

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
      },
    ],
  },
}

module.exports = nextConfig
