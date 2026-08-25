import { describe, expect, it } from 'bun:test'
import { buildSitemapXml } from './sitemap'

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml('https://example.se')

  it('lists indexable routes with absolute urls', () => {
    expect(xml).toContain('<loc>https://example.se/</loc>')
    expect(xml).toContain('<loc>https://example.se/ansokan</loc>')
    expect(xml).toContain('<loc>https://example.se/uppforandekod</loc>')
  })

  it('excludes noindex routes', () => {
    expect(xml).not.toContain('/ansokan/tack')
    expect(xml).not.toContain('/tipsa/tack')
  })

  it('is a urlset document', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
  })
})
