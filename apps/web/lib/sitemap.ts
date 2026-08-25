import { ROUTES } from './routes'

export const buildSitemapXml = (baseUrl: string): string => {
  const urls = ROUTES.filter((route) => !route.noindex)
    .map((route) => `  <url><loc>${baseUrl}${route.path}</loc></url>`)
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}
