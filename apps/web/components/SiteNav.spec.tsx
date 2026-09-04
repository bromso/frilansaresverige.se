import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NAV_TABS } from '../lib/routes'
import SiteNav from './SiteNav'

describe('SiteNav', () => {
  afterEach(() => cleanup())

  it('renders one hub link per nav tab', () => {
    render(<SiteNav />)
    for (const tab of NAV_TABS) {
      expect(screen.getByRole('link', { name: tab.title })).toHaveAttribute(
        'href',
        tab.hub,
      )
    }
  })

  it('opens a tab panel on focus with its section links', () => {
    render(<SiteNav />)
    const trigger = screen.getByRole('link', { name: 'Community' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.focus(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
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
    const trigger = screen.getByRole('link', { name: 'Företag' })
    fireEvent.focus(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('tabs without items are plain links with no dropdown', () => {
    render(<SiteNav />)
    const uppdrag = screen.getByRole('link', { name: 'Uppdrag' })
    expect(uppdrag).toHaveAttribute('href', '/uppdrag')
    expect(uppdrag).not.toHaveAttribute('aria-expanded')
  })
})
