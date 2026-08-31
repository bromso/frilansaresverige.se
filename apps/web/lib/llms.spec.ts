import { describe, expect, it } from 'bun:test'
import { buildLlmsTxt } from './llms'

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt('https://example.se')

  it('opens with the site name and summary blockquote', () => {
    const lines = txt.split('\n')
    expect(lines[0]).toBe('# Frilansare Sverige')
    expect(lines[2].startsWith('> ')).toBe(true)
  })

  it('sections follow the nav tabs', () => {
    expect(txt).toContain('## Frilansare')
    expect(txt).toContain('## Företag')
    expect(txt).toContain('## Uppdrag')
    expect(txt).toContain('## Kunskap')
    expect(txt).toContain('## Community')
  })

  it('lists indexable routes as markdown links with descriptions', () => {
    expect(txt).toMatch(
      /- \[Ansök om medlemskap\]\(https:\/\/example\.se\/ansokan\): .+/,
    )
  })

  it('excludes noindex routes', () => {
    expect(txt).not.toContain('/ansokan/tack')
    expect(txt).not.toContain('/tipsa/tack')
  })
})
