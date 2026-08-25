import { describe, expect, it } from 'bun:test'
import { getBreadcrumbs, getRoute, NAV_TABS, ROUTES } from './routes'

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
})
