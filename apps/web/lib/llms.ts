import { NAV_TABS, ROUTES } from './routes'

// llms.txt (llmstxt.org): a markdown index that tells LLMs what the site
// is and where its pages are. Generated from the same route registry as
// the nav, sitemap and breadcrumbs, so it can't drift from the site's
// information architecture. Sections follow the nav tabs; noindex routes
// (thank-you pages) are left out, matching the sitemap.
export const buildLlmsTxt = (baseUrl: string): string => {
  const home = ROUTES.find((route) => route.path === '/')
  const inSections = new Set(
    NAV_TABS.flatMap((tab) => [tab.hub, ...tab.items.map((i) => i.path)]),
  )

  const lines: string[] = [
    '# Frilansare Sverige',
    '',
    `> ${home?.description ?? ''}`,
    '',
  ]

  for (const tab of NAV_TABS) {
    lines.push(`## ${tab.title}`, '')
    for (const path of [tab.hub, ...tab.items.map((i) => i.path)]) {
      const route = ROUTES.find((r) => r.path === path)
      if (!route || route.noindex) {
        continue
      }
      lines.push(
        `- [${route.title}](${baseUrl}${route.path}): ${route.description}`,
      )
    }
    lines.push('')
  }

  const rest = ROUTES.filter(
    (route) =>
      route.path !== '/' && !route.noindex && !inSections.has(route.path),
  )
  if (rest.length > 0) {
    lines.push('## Övrigt', '')
    for (const route of rest) {
      lines.push(
        `- [${route.title}](${baseUrl}${route.path}): ${route.description}`,
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}
