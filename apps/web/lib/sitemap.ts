import { ROUTES } from './routes'

export const buildSitemapXml = (
  baseUrl: string,
  extraPaths: string[] = [],
): string => {
  const paths = [
    ...ROUTES.filter((route) => !route.noindex).map((route) => route.path),
    ...extraPaths,
  ]
  const urls = paths
    .map((path) => `  <url><loc>${baseUrl}${path}</loc></url>`)
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}
