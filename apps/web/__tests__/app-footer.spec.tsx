import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import SiteFooter from '../components/SiteFooter'

describe('SiteFooter', () => {
  afterEach(() => cleanup())

  it('renders a column per nav tab with its links', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Bli medlem' })).toHaveAttribute(
      'href',
      '/ansokan',
    )
    expect(
      screen.getByRole('link', { name: 'Tipsa om uppdrag' }),
    ).toHaveAttribute('href', '/tipsa')
    expect(screen.getByRole('link', { name: 'Om oss' })).toHaveAttribute(
      'href',
      '/om',
    )
  })

  it('renders the legal links row', () => {
    render(<SiteFooter />)
    for (const legal of [
      ['Integritetspolicy', '/integritetspolicy'],
      ['Cookies', '/cookies'],
      ['Villkor', '/villkor'],
    ]) {
      expect(screen.getByRole('link', { name: legal[0] })).toHaveAttribute(
        'href',
        legal[1],
      )
    }
  })

  it('keeps the external portal link', () => {
    render(<SiteFooter />)
    expect(
      screen.getByRole('link', { name: 'Uppdragsportalen' }),
    ).toHaveAttribute('href', 'https://uppdrag.frilansaresverige.se/')
  })
})
