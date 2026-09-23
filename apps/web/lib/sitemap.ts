import { ROUTES } from './routes'

export interface SitemapEntry {
  path: string
  /** W3C date ("YYYY-MM-DD"); emitted as <lastmod> when present. */
  lastmod?: string
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const buildSitemapXml = (
  baseUrl: string,
  extras: (string | SitemapEntry)[] = [],
): string => {
  const entries: SitemapEntry[] = [
    ...ROUTES.filter((route) => !route.noindex).map((route) => ({
      path: route.path,
    })),
    ...extras.map((extra) =>
      typeof extra === 'string' ? { path: extra } : extra,
    ),
  ]
  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = `<loc>${escapeXml(`${baseUrl}${path}`)}</loc>`
      const mod = lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''
      return `  <url>${loc}${mod}</url>`
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}
