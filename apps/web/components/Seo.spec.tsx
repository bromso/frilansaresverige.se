import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'
import Seo, { buildSeoTags, SITE_URL } from './Seo'

describe('buildSeoTags', () => {
  it('appends the site name to inner pages', () => {
    const tags = buildSeoTags({
      title: 'Ansök om medlemskap',
      description: 'desc',
      path: '/ansokan',
    })
    expect(tags.title).toBe('Ansök om medlemskap – Frilansare Sverige')
    expect(tags.canonical).toBe(`${SITE_URL}/ansokan`)
    expect(tags.robots).toBeNull()
  })

  it('leads with the site name on the home page', () => {
    const tags = buildSeoTags({
      title: 'Sveriges största community för frilansare',
      description: 'desc',
      path: '/',
    })
    expect(tags.title).toBe(
      'Frilansare Sverige – Sveriges största community för frilansare',
    )
    expect(tags.canonical).toBe(`${SITE_URL}/`)
  })

  it('emits robots noindex when asked', () => {
    const tags = buildSeoTags({
      title: 'Tack',
      description: 'desc',
      path: '/tipsa/tack',
      noindex: true,
    })
    expect(tags.robots).toBe('noindex,nofollow')
  })
})

describe('Seo', () => {
  it('renders without crashing', () => {
    render(<Seo title="T" description="D" path="/x" />)
  })
})
