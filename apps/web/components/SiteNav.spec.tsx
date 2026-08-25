import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NAV_TABS } from '../lib/routes'
import SiteNav from './SiteNav'

describe('SiteNav', () => {
  afterEach(() => cleanup())

  it('renders one tab button per nav tab', () => {
    render(<SiteNav />)
    for (const tab of NAV_TABS) {
      expect(
        screen.getByRole('button', { name: tab.title }),
      ).toBeInTheDocument()
    }
  })

  it('expands a tab into its link panel', () => {
    render(<SiteNav />)
    const button = screen.getByRole('button', { name: 'Community' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Om oss' })).toHaveAttribute(
      'href',
      '/om',
    )
    expect(screen.getByRole('link', { name: 'Uppförandekod' })).toHaveAttribute(
      'href',
      '/uppforandekod',
    )
  })

  it('closes on Escape', () => {
    render(<SiteNav />)
    const button = screen.getByRole('button', { name: 'Företag' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('tabs without items link straight to the hub', () => {
    render(<SiteNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Uppdrag' }))
    expect(screen.getByRole('link', { name: /uppdrag/i })).toHaveAttribute(
      'href',
      '/uppdrag',
    )
  })
})
