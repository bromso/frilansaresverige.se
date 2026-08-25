import { describe, expect, it } from 'bun:test'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getBreadcrumbs, getRoute, NAV_TABS, ROUTES } from './routes'

const PAGES_DIR = join(__dirname, '..', 'pages')

// Files under pages/ that are Next.js internals or non-page routes, not
// entries the ROUTES registry needs to know about.
const SKIP_BASENAMES = new Set(['_app', '_document', '404', '500'])

function collectPageRoutes(dir: string, prefix = ''): string[] {
  const routes: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'api') continue
    if (entry.isDirectory()) {
      routes.push(
        ...collectPageRoutes(join(dir, entry.name), `${prefix}/${entry.name}`),
      )
      continue
    }
    if (!/\.(tsx|ts)$/.test(entry.name)) continue
    if (/\.(spec|test)\.(tsx|ts)$/.test(entry.name)) continue
    if (entry.name.endsWith('.d.ts')) continue

    const basename = entry.name.replace(/\.(tsx|ts)$/, '')
    if (SKIP_BASENAMES.has(basename)) continue
    if (basename === 'sitemap.xml') continue

    routes.push(basename === 'index' ? prefix || '/' : `${prefix}/${basename}`)
  }
  return routes
}

describe('routes registry', () => {
  it('contains the five nav tabs in IA order', () => {
    expect(NAV_TABS.map((t) => t.title)).toEqual([
      'Frilansare',
      'Företag',
      'Uppdrag',
      'Kunskap',
      'Community',
    ])
  })

  it('every nav item points at a registered route', () => {
    const paths = new Set(ROUTES.map((r) => r.path))
    for (const tab of NAV_TABS) {
      expect(paths.has(tab.hub)).toBe(true)
      for (const item of tab.items) {
        expect(paths.has(item.path)).toBe(true)
      }
    }
  })

  it('every parent reference resolves to a registered route', () => {
    const paths = new Set(ROUTES.map((r) => r.path))
    for (const route of ROUTES) {
      if (route.parent) {
        expect(paths.has(route.parent)).toBe(true)
      }
    }
  })

  it('looks up a route by path', () => {
    expect(getRoute('/ansokan')?.title).toBe('Ansök om medlemskap')
    expect(getRoute('/finns-inte')).toBeUndefined()
  })

  it('builds breadcrumbs from the parent chain', () => {
    expect(getBreadcrumbs('/uppforandekod')).toEqual([
      { path: '/', label: 'Hem' },
      { path: '/community', label: 'Community' },
      { path: '/uppforandekod', label: 'Uppförandekod' },
    ])
  })

  it('marks tack pages noindex', () => {
    expect(getRoute('/ansokan/tack')?.noindex).toBe(true)
    expect(getRoute('/tipsa/tack')?.noindex).toBe(true)
  })

  it('every page file under pages/ has a matching ROUTES entry', () => {
    const paths = new Set(ROUTES.map((r) => r.path))
    const pageRoutes = collectPageRoutes(PAGES_DIR)
    expect(pageRoutes.length).toBeGreaterThan(0)
    for (const route of pageRoutes) {
      expect(paths.has(route)).toBe(true)
    }
  })
})
